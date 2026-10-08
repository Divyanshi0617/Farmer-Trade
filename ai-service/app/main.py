"""
HumanLink AI Service - Main FastAPI Application

1. WHAT IS FASTAPI?
   FastAPI is a modern, fast (high-performance) web framework for building APIs
   with Python based on standard Python type hints. It automatically generates
   interactive API documentation (Swagger UI at /docs and ReDoc at /redoc).

2. WHAT DOES THE FASTAPI APP OBJECT DO?
   The `app = FastAPI(...)` object serves as the main application container.
   It registers API routes/endpoints, handles incoming HTTP requests, manages
   middleware, and coordinates response serialization (converting Python dicts to JSON).

3. WHAT IS AN API ENDPOINT?
   An API endpoint is a specific URL path (e.g. `/` or `/health`) combined with an
   HTTP method (GET, POST, PUT, DELETE) that allows external applications (like Node.js
   or React) to communicate with this service.

4. WHAT IS THE /health ENDPOINT USED FOR?
   The `/health` endpoint is a standard health-check route used by monitoring tools,
   load balancers, container orchestrators, and gateway servers to verify that the
   AI service is alive, responsive, and ready to accept requests.

5. WHAT IS A PYDANTIC MODEL?
   A Pydantic model (`BaseModel`) defines the exact schema, field names, and data types
   expected in API requests or responses. Pydantic validates incoming JSON data automatically.

6. WHAT DOES REQUEST VALIDATION DO?
   Request validation inspects incoming HTTP payload fields. If any required field is missing,
   null, empty, or whitespace-only, Pydantic rejects the request with an HTTP 422 error response
   before any business logic executes.

7. WHY IS POST USED FOR PREDICTION INPUT?
   HTTP POST allows client applications to send structured JSON body payloads containing
   multiple request parameters (`crop`, `market`, `district`, `state`) cleanly and securely.

8. WHY IS estimatedPrice CURRENTLY null?
   In Phase 9 Step 2, we build and verify the API schema contract, validation layer, and OpenAPI specs.
   The actual machine learning prediction model will be connected in subsequent Phase 9 steps.
"""

import math
from datetime import datetime
from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, field_validator

from app.ml_model import load_model_and_metadata, predict_market_price
from app.mongodb_data import get_market_price_records
from app.data_preparation import parse_date, extract_date_features

# Create the main FastAPI application instance
app = FastAPI(
    title="HumanLink AI Service",
    description="Microservice providing AI & Smart Recommendations for the HumanLink platform.",
    version="1.0.0"
)


# ==================================================
# PYDANTIC REQUEST SCHEMAS & VALIDATION
# ==================================================

class PricePredictionRequest(BaseModel):
    """
    Schema for price prediction requests.
    Requires crop, market, district, and state.
    Rejects empty or whitespace-only inputs.
    """
    crop: str
    market: str
    district: str
    state: str

    @field_validator("crop", "market", "district", "state")
    @classmethod
    def validate_not_empty_or_whitespace(cls, value: str, info) -> str:
        if not value or not value.strip():
            raise ValueError(f"'{info.field_name}' cannot be empty or whitespace-only.")
        return value.strip()


# ==================================================
# API ENDPOINTS
# ==================================================

@app.get("/")
def read_root():
    """
    Root endpoint: returns a greeting confirming the AI service is operational.
    """
    return {
        "message": "HumanLink AI Service is running"
    }


@app.get("/health")
def health_check():
    """
    Health check endpoint: used by external monitoring and backend gateways
    to confirm service operational status.
    """
    return {
        "status": "ok",
        "service": "HumanLink AI Service"
    }


@app.post("/predict-price")
def predict_price(request: PricePredictionRequest):
    """
    Price Prediction API Endpoint.
    
    Loads trained machine learning model and queries historical market price records
    from MongoDB to construct lag features for real price estimation.
    """
    pipeline, metadata = load_model_and_metadata()

    if not pipeline:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Price prediction model is not currently trained."
        )

    # Fetch historical records for this crop and market from MongoDB
    records = get_market_price_records(
        filter_dict={"cropName": request.crop, "marketName": request.market},
        source_filter=None,
        limit=100
    )

    # Fallback search by crop if exact (crop, market) history is empty
    if not records:
        records = get_market_price_records(
            filter_dict={"cropName": request.crop},
            source_filter=None,
            limit=100
        )

    if not records:
        return {
            "success": False,
            "crop": request.crop,
            "market": request.market,
            "district": request.district,
            "state": request.state,
            "estimatedPrice": None,
            "unit": "quintal",
            "message": "Insufficient historical market data available for this commodity/market."
        }

    # Sort historical records by priceDate
    records.sort(key=lambda r: parse_date(r.get("priceDate")))
    latest_rec = records[-1]
    prev_price = float(latest_rec.get("modalPrice"))

    p2_price = float(records[-2].get("modalPrice")) if len(records) >= 2 else float("nan")
    p3_price = float(records[-3].get("modalPrice")) if len(records) >= 3 else float("nan")

    now = datetime.now()
    date_feats = extract_date_features(now)

    feature_dict = {
        "cropName": request.crop,
        "marketName": request.market,
        "district": request.district,
        "state": request.state,
        "year": date_feats["year"],
        "month": date_feats["month"],
        "day": date_feats["day"],
        "day_of_week": date_feats["day_of_week"],
        "previous_price": prev_price,
        "price_2_records_ago": p2_price,
        "price_3_records_ago": p3_price
    }

    try:
        estimated_val = predict_market_price(pipeline, feature_dict)
        if math.isnan(estimated_val) or estimated_val < 0:
            estimated_val = prev_price

        model_name = metadata.get("selected_model_name", "RandomForest") if metadata else "RandomForest"
        data_src = metadata.get("data_source", "Government of India OGD / AGMARKNET") if metadata else "Government of India OGD / AGMARKNET"

        return {
            "success": True,
            "crop": request.crop,
            "market": request.market,
            "district": request.district,
            "state": request.state,
            "estimatedPrice": round(estimated_val, 2),
            "unit": "quintal",
            "model": model_name,
            "dataSource": data_src,
            "message": "Estimated modal price based on historical government mandi data"
        }
    except Exception as e:
        return {
            "success": False,
            "crop": request.crop,
            "market": request.market,
            "district": request.district,
            "state": request.state,
            "estimatedPrice": None,
            "message": f"Prediction error: {str(e)}"
        }

