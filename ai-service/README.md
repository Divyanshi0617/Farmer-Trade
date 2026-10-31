# HumanLink AI Service

An isolated microservice built with **Python** and **FastAPI** to power smart recommendations, price analytics, and machine learning capabilities for the **HumanLink — Farmer Discovery and Linkage Platform**.

---

## 1. Purpose of the AI Service
The AI Service handles computationally intensive analytics, price predictions, market intelligence, and matching recommendations for farmers and buyers. Keeping these functions in a dedicated microservice ensures that the core Node.js backend remains fast and decoupled.

---

## 2. Why Python for HumanLink AI/ML?
Python is the industry-standard language for Artificial Intelligence, Machine Learning, and Data Science. It provides access to world-class libraries such as NumPy, Pandas, Scikit-Learn, PyTorch, and TensorFlow, making model training and predictive inference seamless.

---

## 3. Why FastAPI?
- **High Performance**: Asynchronous execution via Starlette and Uvicorn.
- **Auto-Generated OpenAPI Docs**: Interactive documentation automatically built at `/docs` (Swagger UI) and `/redoc`.
- **Data Validation**: Native integration with Pydantic for type hints and payload validation.
- **Developer Friendly**: Lightweight, modern, and simple to maintain.

---

## 4. Setup & Running on macOS

### Step A: Navigate to AI Service Directory
```bash
cd ~/Desktop/HumanLink/ai-service
```

### Step B: Create Python Virtual Environment
```bash
python3 -m venv .venv
```

### Step C: Activate Virtual Environment (macOS)
```bash
source .venv/bin/activate
```

### Step D: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step E: Start the FastAPI Server
```bash
uvicorn app.main:app --reload --port 8000
```

The service will run locally at:
- **Base URL**: `http://127.0.0.1:8000`
- **Health Check**: `http://127.0.0.1:8000/health`
- **Interactive API Docs**: `http://127.0.0.1:8000/docs`

---

## 5. Testing the Endpoints

### Test Root Endpoint:
```bash
curl http://127.0.0.1:8000/
```
**Response**:
```json
{
  "message": "HumanLink AI Service is running"
}
```

### Test Health Endpoint:
```bash
curl http://127.0.0.1:8000/health
```
**Response**:
```json
{
  "status": "ok",
  "service": "HumanLink AI Service"
}
```

---

## 6. Step 2 — Prediction API Contract

### Endpoint: `POST /predict-price`

#### Expected Request Body Schema (`PricePredictionRequest`):
```json
{
  "crop": "Wheat",
  "market": "Ludhiana Mandi",
  "district": "Ludhiana",
  "state": "Punjab"
}
```

#### Example Valid cURL Request:
```bash
curl -X POST http://127.0.0.1:8000/predict-price \
  -H "Content-Type: application/json" \
  -d '{"crop": "Wheat", "market": "Ludhiana Mandi", "district": "Ludhiana", "state": "Punjab"}'
```

#### Example Valid Response (`HTTP 200 OK`):
```json
{
  "success": true,
  "crop": "Wheat",
  "market": "Ludhiana Mandi",
  "district": "Ludhiana",
  "state": "Punjab",
  "estimatedPrice": null,
  "message": "ML model will be connected in the next step"
}
```

#### Input Validation Behavior:
- **Missing Required Fields**: Returns `HTTP 422 Unprocessable Entity`.
- **Empty or Whitespace-Only Strings**: Returns `HTTP 422 Unprocessable Entity` (e.g. `"crop": ""` or `"crop": "   "`).
- **Placeholder Status**: `estimatedPrice` is explicitly `null` in Step 2 as the API schema contract and Pydantic validation are established before building the ML model in subsequent steps.

---

## 7. Step 3 — Market Price Data Preparation

The `app.data_preparation` module provides validation, feature engineering, chronological ordering, and dataset transformation utilities.

### Key Data Concepts & Explanations:
1. **Why Raw Data Must Be Prepared**: Raw database records contain missing fields, inconsistent dates, or unsorted timelines. Data preparation cleans data, extracts time features, generates historical (lag) observations, and defines target variables.
2. **What is a Feature?**: An input variable used by a machine learning model to make predictions (e.g., `cropName`, `marketName`, `previous_price`, `month`, `day_of_week`).
3. **What is a Target?**: The ground-truth value the model aims to predict (`target_price` = `modalPrice` of the target record).
4. **What are Historical / Lag Features?**: Lag features represent past values of the target variable from prior timestamps (`previous_price` at $t-1$, `price_2_records_ago` at $t-2$, `price_3_records_ago` at $t-3$).
5. **Why Chronological Ordering Matters & What is Data Leakage?**: Data leakage occurs when future information (e.g., tomorrow's price) is accidentally included in input features used to predict past or present targets. Sorting records chronologically ensures feature values come strictly from past timestamps ($t-1, t-2, \dots$).
6. **Why Crop + Market Histories Must Remain Separated**: Price trends for Wheat in Ludhiana Mandi are independent of Rice in Amritsar Mandi. Grouping by `(cropName, marketName)` ensures lag features are calculated strictly within the same commodity and location context.

> [!IMPORTANT]
> **Dataset Limitation Disclaimer**:
> The current Phase 5 market-price records are controlled development/sample data. They are useful for developing and testing the pipeline, but they should not be represented as a production-scale historical dataset.

---

## 8. Step 4 — Baseline ML Model

The `app.ml_model` module builds, trains, evaluates, and serializes HumanLink's first baseline machine learning regression model for market-price estimation.

### Key ML Concepts & Explanations:
1. **What Machine Learning Regression Means**: Regression is a supervised machine learning task that predicts a continuous numeric value (e.g. market price in ₹ per quintal) based on input feature relationships.
2. **What RandomForestRegressor Does at a High Level**: RandomForestRegressor is an ensemble learning algorithm that constructs multiple decision trees during training. Each tree outputs a numeric prediction, and the forest averages these individual tree predictions to produce a smooth, robust final price estimate.
3. **Features Used**:
   - Categorical: `cropName`, `marketName`, `district`, `state`
   - Numeric & Date: `year`, `month`, `day`, `day_of_week`
   - Historical Lag: `previous_price` ($t-1$), `price_2_records_ago` ($t-2$), `price_3_records_ago` ($t-3$)
4. **Target Predicted**: `target_price` (the current modal price for the target record).
5. **Why Categorical Encoding is Necessary**: Machine learning models rely on linear algebra and numeric matrix operations; they cannot process raw text strings directly. We use scikit-learn's `OneHotEncoder` within a `ColumnTransformer` to convert categorical text values into binary indicator vectors without imposing artificial numeric ordering.
6. **Why Chronological Splitting is Used**: Market price observations are time-series data. Randomly shuffling data for evaluation would allow future price records into the training set and past records into the test set, creating unrealistic evaluation metrics. Chronological splitting uses earlier records for training and later records for testing.
7. **What Data Leakage Means**: Data leakage occurs when information from the target variable or future timestamps leaks into the input features or training preprocessing step. To prevent leakage:
   - `target_price` is strictly removed from input feature dictionaries before training.
   - Preprocessing transformers (imputers, encoders) are fitted strictly on training data (`fit_transform`) and applied to test data (`transform`).
8. **What MAE Means**: Mean Absolute Error (MAE) measures the average magnitude of prediction errors in absolute value units (₹). For instance, an MAE of ₹32.80 means the model's price estimates deviate from actual prices by an average of ₹32.80 per unit.
9. **Why the Current 19-Record Dataset is Insufficient for Production-Quality Evaluation**: A 19-record sample dataset yields very few usable lag training rows after grouping and time-series train/test splitting. While sufficient to verify model construction and code execution, statistical evaluation metrics (MAE/RMSE) on such a small sample are not statistically reliable.
10. **Where the Model is Saved**: The trained pipeline is serialized using `joblib` and saved to `ai-service/models/market_price_model.joblib`.

> [!CAUTION]
> **Baseline Prototype Notice**:
> The current model is a baseline prototype trained/evaluated on controlled development/sample data. It must not be represented as a production-grade price forecasting system.

---

## 9. Step 5A — Real Government Mandi Data Integration

HumanLink integrates real daily agricultural market-price data from the Government of India's Open Government Data (OGD) Platform (data.gov.in / AGMARKNET).

### Key Integration Specifications:
1. **Official Data Source Name**: Open Government Data (OGD) Platform India — "Current Daily Price of Various Commodities from Various Markets (Mandi)".
2. **Official Source URL & Resource ID**: `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070`
3. **Associated Department**: Ministry of Agriculture and Farmers Welfare / Directorate of Marketing and Inspection (DMI) / AGMARKNET.
4. **Environment Variables**:
   - `DATA_GOV_API_KEY`: API key for accessing the OGD platform (configured via `.env`).
5. **Sync Mechanism & Manual Procedure**:
   - Backend Service: `backend/src/services/governmentMarketPriceService.js`
   - Admin Endpoint: `POST /api/market-prices/sync-government?state=Punjab&limit=100`
   - CLI Development Script: `node backend/src/scripts/syncGovernmentPrices.js`
6. **Normalization Mapping**:
   - `commodity` $\rightarrow$ `cropName`
   - `market` $\rightarrow$ `marketName`
   - `state` $\rightarrow$ `state`
   - `district` $\rightarrow$ `district`
   - `variety` $\rightarrow$ `variety`
   - `grade` $\rightarrow$ `cropType`
   - `arrival_date` (DD/MM/YYYY) $\rightarrow$ `priceDate`
   - `min_price` $\rightarrow$ `minPrice`
   - `modal_price` $\rightarrow$ `modalPrice`
   - `max_price` $\rightarrow$ `maxPrice`
   - `source` $\rightarrow$ `"Government of India OGD / AGMARKNET"`
   - `lastSyncedAt` $\rightarrow$ `Date.now()`
7. **Duplicate Prevention**: Unique compound MongoDB index on `{ cropName: 1, marketName: 1, state: 1, district: 1, priceDate: 1, variety: 1 }` with upsert strategy (`updateOne` + `{ upsert: true }`).
8. **Validation**: Enforces non-negative numeric prices and consistency rule: `minPrice <= modalPrice <= maxPrice`. Invalid source rows are skipped and logged.
9. **Sample vs. Government Data Distinction**: Government records are labeled `"Government of India OGD / AGMARKNET"`. Development sample data remains labeled `"Development Sample Data"`.
10. **Demo Procedure**:
    - Execute sync for `state=Punjab` (or filter by `district=Ludhiana`).
    - Navigate to Frontend `http://localhost:5174/farmer/market-prices` to view real government mandi prices with clear date and source attribution.


