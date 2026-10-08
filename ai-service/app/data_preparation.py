"""
HumanLink AI Service - Market Price Data Preparation Module

Uses Pandas and NumPy for tabular data manipulation, chronological ordering,
lag feature engineering, and dataset summary reports.
"""

from datetime import datetime
from typing import List, Dict, Any, Tuple, Optional
import pandas as pd
import numpy as np


def validate_market_price_record(record: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
    """
    Validates a single market price record against business rules and schemas.
    """
    crop_name = record.get("cropName") or record.get("crop")
    market_name = record.get("marketName") or record.get("market")
    state = record.get("state")
    district = record.get("district")
    price_date = record.get("priceDate") or record.get("date")

    # String field non-empty check
    for field_name, value in [("cropName", crop_name), ("marketName", market_name), ("state", state), ("district", district)]:
        if not value or not isinstance(value, str) or not value.strip():
            return False, f"Missing or invalid string for '{field_name}'"

    # Numeric price checks
    min_price = record.get("minPrice")
    modal_price = record.get("modalPrice")
    max_price = record.get("maxPrice")

    for field_name, val in [("minPrice", min_price), ("modalPrice", modal_price), ("maxPrice", max_price)]:
        if val is None or not isinstance(val, (int, float)) or val < 0 or not np.isfinite(val):
            return False, f"Missing, non-finite, or negative price for '{field_name}': {val}"

    # Business rule check: minPrice <= modalPrice <= maxPrice
    if not (min_price <= modal_price <= max_price):
        return False, f"Invalid price ordering: minPrice ({min_price}) <= modalPrice ({modal_price}) <= maxPrice ({max_price}) violated"

    # Date parsing check
    if not price_date:
        return False, "Missing priceDate"

    parsed_date = parse_date(price_date)
    if not parsed_date:
        return False, f"Invalid priceDate format: {price_date}"

    return True, None


def parse_date(date_val: Any) -> Optional[datetime]:
    """
    Helper function to parse various date formats into a Python datetime object.
    """
    if isinstance(date_val, datetime):
        return date_val
    if isinstance(date_val, pd.Timestamp):
        return date_val.to_pydatetime()
    if isinstance(date_val, str):
        date_str = date_val.strip().replace("Z", "+00:00")
        for fmt in ("%Y-%m-%d", "%Y-%m-%dT%H:%M:%S.%f", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M:%S"):
            try:
                return datetime.strptime(date_str.split("+")[0].split(".")[0], fmt)
            except ValueError:
                continue
    return None


def extract_date_features(dt: datetime) -> Dict[str, int]:
    """
    Extracts numerical calendar features from a datetime object.
    """
    return {
        "year": int(dt.year),
        "month": int(dt.month),
        "day": int(dt.day),
        "day_of_week": int(dt.weekday())
    }


def prepare_training_dataset(records: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """
    Transforms raw market price records into chronologically ordered training examples with lag features
    using Pandas DataFrame operations.
    
    Returns:
    - prepared_rows: List of training row dictionaries containing input features and target_price.
    - summary: Dataset summary report dictionary.
    """
    total_raw_records = len(records)
    valid_records = []
    invalid_records_info = []

    # 1. Validate raw records
    for idx, rec in enumerate(records):
        is_valid, err_msg = validate_market_price_record(rec)
        if is_valid:
            valid_records.append(rec)
        else:
            invalid_records_info.append({"index": idx, "record": rec, "reason": err_msg})

    if not valid_records:
        return [], {
            "total_raw_records": total_raw_records,
            "valid_records": 0,
            "invalid_records": len(invalid_records_info),
            "number_of_crops": 0,
            "number_of_markets": 0,
            "number_of_groups": 0,
            "earliest_date": "N/A",
            "latest_date": "N/A",
            "training_rows_generated": 0,
            "rows_excluded_insufficient_history": 0,
            "invalid_records_details": invalid_records_info
        }

    # 2. Build Pandas DataFrame
    df = pd.DataFrame(valid_records)
    
    # Normalize column names
    if "crop" in df.columns and "cropName" not in df.columns:
        df["cropName"] = df["crop"]
    if "market" in df.columns and "marketName" not in df.columns:
        df["marketName"] = df["market"]
    if "date" in df.columns and "priceDate" not in df.columns:
        df["priceDate"] = df["date"]

    df["cropName"] = df["cropName"].astype(str).str.strip()
    df["marketName"] = df["marketName"].astype(str).str.strip()
    df["district"] = df["district"].astype(str).str.strip()
    df["state"] = df["state"].astype(str).str.strip()
    df["modalPrice"] = pd.to_numeric(df["modalPrice"], errors="coerce")
    df["parsedDate"] = df["priceDate"].apply(parse_date)

    # Filter out rows where date parsing failed
    df = df.dropna(subset=["parsedDate", "modalPrice"]).copy()

    # 3. Sort chronologically by parsedDate
    df = df.sort_values(by=["parsedDate"]).reset_index(drop=True)

    training_rows = []
    excluded_insufficient_history = 0
    grouped = df.groupby(["cropName", "marketName"])

    all_dates = []

    # 4. Generate lag features within each (cropName, marketName) group
    for (crop_name, market_name), group_df in grouped:
        group_df = group_df.sort_values(by=["parsedDate"]).reset_index(drop=True)
        modal_prices = group_df["modalPrice"].values

        for i in range(len(group_df)):
            current_dt = group_df.loc[i, "parsedDate"]
            all_dates.append(current_dt)

            # Mandatory rule: First record in group has no prior historical price observation
            if i < 1:
                excluded_insufficient_history += 1
                continue

            prev_price = float(modal_prices[i - 1])
            price_2_ago = float(modal_prices[i - 2]) if i >= 2 else None
            price_3_ago = float(modal_prices[i - 3]) if i >= 3 else None

            date_feats = extract_date_features(current_dt)

            row_dict = {
                "cropName": crop_name,
                "marketName": market_name,
                "district": group_df.loc[i, "district"],
                "state": group_df.loc[i, "state"],
                "date": current_dt.strftime("%Y-%m-%d"),
                "year": date_feats["year"],
                "month": date_feats["month"],
                "day": date_feats["day"],
                "day_of_week": date_feats["day_of_week"],
                "previous_price": prev_price,
                "price_2_records_ago": price_2_ago,
                "price_3_records_ago": price_3_ago,
                "target_price": float(modal_prices[i])
            }
            training_rows.append(row_dict)

    # 5. Generate Summary Report
    all_crops = df["cropName"].nunique()
    all_markets = df["marketName"].nunique()
    earliest_date = min(all_dates).strftime("%Y-%m-%d") if all_dates else "N/A"
    latest_date = max(all_dates).strftime("%Y-%m-%d") if all_dates else "N/A"

    summary = {
        "total_raw_records": total_raw_records,
        "valid_records": len(df),
        "invalid_records": len(invalid_records_info),
        "number_of_crops": all_crops,
        "number_of_markets": all_markets,
        "number_of_groups": len(grouped),
        "earliest_date": earliest_date,
        "latest_date": latest_date,
        "training_rows_generated": len(training_rows),
        "rows_excluded_insufficient_history": excluded_insufficient_history,
        "invalid_records_details": invalid_records_info
    }

    return training_rows, summary
