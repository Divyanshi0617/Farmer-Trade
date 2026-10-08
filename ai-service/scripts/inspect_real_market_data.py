"""
HumanLink AI Service - Real Market Data Inspection Script

Inspects the MarketPrice dataset stored in MongoDB, separates real Government
mandi data from sample data, and generates a detailed statistics report.
"""

import sys
import os
import json

# Add parent directory to python path
AI_SERVICE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if AI_SERVICE_DIR not in sys.path:
    sys.path.insert(0, AI_SERVICE_DIR)

from app.mongodb_data import get_market_price_records
from app.data_preparation import prepare_training_dataset, parse_date


def inspect_real_data():
    print("==================================================")
    print("HUMANLINK AI - REAL MARKET DATASET INSPECTION")
    print("==================================================")

    # Fetch all records from MongoDB
    all_records = get_market_price_records(source_filter=None, limit=5000)
    gov_records = [r for r in all_records if "Government" in r.get("source", "")]
    sample_records = [r for r in all_records if "Government" not in r.get("source", "")]

    print(f"\nTotal Records in Database: {len(all_records)}")
    print(f"  ├─ Government Data Records (OGD / AGMARKNET): {len(gov_records)}")
    print(f"  └─ Development / Sample Records: {len(sample_records)}")

    # Target dataset for inspection
    records_to_inspect = gov_records if len(gov_records) > 0 else all_records
    source_name = "Government of India OGD / AGMARKNET" if len(gov_records) > 0 else "Development Sample Data"
    
    print(f"\nInspecting Active Dataset Source: [{source_name}]")

    if not records_to_inspect:
        print("WARNING: No market price records found in MongoDB.")
        return

    # Process through data preparation pipeline
    prepared_rows, summary = prepare_training_dataset(records_to_inspect)

    # Unique value counts
    crops = set(r.get("cropName") for r in records_to_inspect if r.get("cropName"))
    markets = set(r.get("marketName") for r in records_to_inspect if r.get("marketName"))
    states = set(r.get("state") for r in records_to_inspect if r.get("state"))
    districts = set(r.get("district") for r in records_to_inspect if r.get("district"))
    varieties = set(r.get("variety") for r in records_to_inspect if r.get("variety"))

    print("\n--- DATASET BREAKDOWN ---")
    print(f"Date Range: {summary['earliest_date']} to {summary['latest_date']}")
    print(f"Unique Crops ({len(crops)}): {list(crops)[:10]}")
    print(f"Unique Markets ({len(markets)}): {list(markets)[:10]}")
    print(f"Unique States ({len(states)}): {list(states)}")
    print(f"Unique Districts ({len(districts)}): {list(districts)[:10]}")
    print(f"Unique Varieties ({len(varieties)}): {list(varieties)[:10]}")

    print("\n--- FEATURE ENGINEERING & LAG STATISTICS ---")
    print(f"Total Raw Records Inspected: {summary['total_raw_records']}")
    print(f"Valid Records: {summary['valid_records']}")
    print(f"Invalid / Rejected Records: {summary['invalid_records']}")
    print(f"Number of (Crop, Market) Groups: {summary['number_of_groups']}")
    print(f"Usable Training Rows Generated (after lag creation): {summary['training_rows_generated']}")
    print(f"Rows Excluded (insufficient history for t-1 lag): {summary['rows_excluded_insufficient_history']}")

    print("\n--- EVALUATION READINESS CONCLUSION ---")
    if summary['training_rows_generated'] < 20:
        print("⚠️ STATUS: INSUFFICIENT REAL DATA FOR RELIABLE MODEL EVALUATION")
        print(f"   Explanation: Current dataset yields {summary['training_rows_generated']} usable training rows.")
        print("   Statistical metrics (MAE/RMSE) on such a small sample will not be production-reliable.")
    else:
        print("✅ STATUS: SUFFICIENT DATA FOR BASELINE MODEL TRAINING & EVALUATION")

    print("==================================================")


if __name__ == "__main__":
    inspect_real_data()
