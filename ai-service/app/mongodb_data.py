"""
HumanLink AI Service - MongoDB Data Access Module

Connects to the MongoDB database using MONGO_URI from environment variables,
queries MarketPrice records, normalizes documents into clean Python dictionaries,
and closes connections cleanly.
"""

import os
from typing import List, Dict, Any, Optional
from pymongo import MongoClient
import pymongo

# Load environment variables from backend/.env if available
def get_mongo_uri() -> str:
    uri = os.environ.get("MONGO_URI") or os.environ.get("MONGODB_URI")
    if not uri:
        # Check backend/.env
        env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "backend", ".env")
        if os.path.exists(env_path):
            with open(env_path, "r") as f:
                for line in f:
                    line = line.strip()
                    if line.startswith("MONGO_URI=") or line.startswith("MONGODB_URI="):
                        key, val = line.split("=", 1)
                        if val.strip() and not val.strip().startswith("PORT="):
                            uri = val.strip()
                            break
    return uri or "mongodb://127.0.0.1:27017/humanlink"


def get_market_price_records(
    filter_dict: Optional[Dict[str, Any]] = None,
    source_filter: Optional[str] = "Government of India OGD / AGMARKNET",
    limit: int = 2000
) -> List[Dict[str, Any]]:
    """
    Retrieves MarketPrice records from MongoDB.
    Filters out invalid records and returns clean dicts.
    """
    mongo_uri = get_mongo_uri()
    client = None
    records = []

    try:
        # Connect to MongoDB with timeout
        client = MongoClient(mongo_uri, serverSelectionTimeoutMS=4000)
        
        # Parse database name from URI if present, default to HumanLink
        db_name = "HumanLink"
        if "/" in mongo_uri.split("://")[-1]:
            path_part = mongo_uri.split("://")[-1].split("/", 1)[-1].split("?")[0]
            if path_part:
                db_name = path_part

        db = client[db_name]
        collection = db["marketprices"]

        query = filter_dict.copy() if filter_dict else {}
        if source_filter:
            query["source"] = source_filter

        cursor = collection.find(query).sort("priceDate", pymongo.ASCENDING).limit(limit)

        for doc in cursor:
            # Clean and validate basic record structure
            crop_name = doc.get("cropName") or doc.get("crop")
            market_name = doc.get("marketName") or doc.get("market")
            state = doc.get("state")
            district = doc.get("district")
            modal_price = doc.get("modalPrice")
            price_date = doc.get("priceDate") or doc.get("date")

            if not crop_name or not market_name or not state or not district:
                continue
            if modal_price is None or not isinstance(modal_price, (int, float)) or modal_price < 0:
                continue
            if not price_date:
                continue

            records.append({
                "_id": str(doc.get("_id")),
                "cropName": str(crop_name).strip(),
                "marketName": str(market_name).strip(),
                "district": str(district).strip(),
                "state": str(state).strip(),
                "variety": str(doc.get("variety", "")).strip(),
                "minPrice": float(doc.get("minPrice", modal_price)),
                "maxPrice": float(doc.get("maxPrice", modal_price)),
                "modalPrice": float(modal_price),
                "unit": str(doc.get("unit", "quintal")).strip(),
                "priceDate": price_date,
                "source": str(doc.get("source", "Development Sample Data")).strip()
            })

    except Exception as e:
        print(f"[MONGODB_DATA_WARNING] Could not query MongoDB ({e}). Providing development sample records.")
    finally:
        if client:
            client.close()

    # Fallback development sample records if DB connection returns empty
    if not records:
        records = get_sample_fallback_records(filter_dict, source_filter)

    return records


def get_sample_fallback_records(filter_dict=None, source_filter=None) -> List[Dict[str, Any]]:
    """
    Controlled development sample dataset fallback (Agmarknet simulation).
    Used for local AI service testing when live MongoDB cluster is offline.
    """
    sample_records = [
        {"cropName": "Wheat", "marketName": "Ludhiana Mandi", "district": "Ludhiana", "state": "Punjab", "minPrice": 2000, "modalPrice": 2100, "maxPrice": 2200, "unit": "quintal", "priceDate": "2026-09-01", "source": "Development Sample Data"},
        {"cropName": "Wheat", "marketName": "Ludhiana Mandi", "district": "Ludhiana", "state": "Punjab", "minPrice": 2050, "modalPrice": 2150, "maxPrice": 2250, "unit": "quintal", "priceDate": "2026-09-02", "source": "Development Sample Data"},
        {"cropName": "Wheat", "marketName": "Ludhiana Mandi", "district": "Ludhiana", "state": "Punjab", "minPrice": 2100, "modalPrice": 2200, "maxPrice": 2300, "unit": "quintal", "priceDate": "2026-09-03", "source": "Development Sample Data"},
        {"cropName": "Wheat", "marketName": "Ludhiana Mandi", "district": "Ludhiana", "state": "Punjab", "minPrice": 2150, "modalPrice": 2280, "maxPrice": 2380, "unit": "quintal", "priceDate": "2026-09-04", "source": "Development Sample Data"},
        {"cropName": "Wheat", "marketName": "Ludhiana Mandi", "district": "Ludhiana", "state": "Punjab", "minPrice": 2200, "modalPrice": 2310, "maxPrice": 2400, "unit": "quintal", "priceDate": "2026-09-05", "source": "Development Sample Data"},
        {"cropName": "Wheat", "marketName": "Amritsar Mandi", "district": "Amritsar", "state": "Punjab", "minPrice": 2020, "modalPrice": 2120, "maxPrice": 2220, "unit": "quintal", "priceDate": "2026-09-01", "source": "Development Sample Data"},
        {"cropName": "Wheat", "marketName": "Amritsar Mandi", "district": "Amritsar", "state": "Punjab", "minPrice": 2080, "modalPrice": 2180, "maxPrice": 2280, "unit": "quintal", "priceDate": "2026-09-02", "source": "Development Sample Data"},
        {"cropName": "Rice", "marketName": "Amritsar Mandi", "district": "Amritsar", "state": "Punjab", "minPrice": 3000, "modalPrice": 3200, "maxPrice": 3400, "unit": "quintal", "priceDate": "2026-09-01", "source": "Development Sample Data"},
        {"cropName": "Rice", "marketName": "Amritsar Mandi", "district": "Amritsar", "state": "Punjab", "minPrice": 3050, "modalPrice": 3250, "maxPrice": 3450, "unit": "quintal", "priceDate": "2026-09-02", "source": "Development Sample Data"},
        {"cropName": "Rice", "marketName": "Amritsar Mandi", "district": "Amritsar", "state": "Punjab", "minPrice": 3100, "modalPrice": 3310, "maxPrice": 3500, "unit": "quintal", "priceDate": "2026-09-03", "source": "Development Sample Data"}
    ]

    filtered = []
    for r in sample_records:
        if source_filter and "Government" in source_filter and "Government" not in r["source"]:
            continue
        if filter_dict:
            c = filter_dict.get("cropName") or filter_dict.get("crop")
            m = filter_dict.get("marketName") or filter_dict.get("market")
            if c and r["cropName"].lower() != c.lower():
                continue
            if m and r["marketName"].lower() != m.lower():
                continue
        filtered.append(r)

    return filtered

