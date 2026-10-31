"""
HumanLink AI Service - Model Training & Evaluation Script

Connects to MongoDB, retrieves real Government Mandi records, builds Pandas lag
features, trains Random Forest & XGBoost models, evaluates MAE/RMSE, selects the
best model, and serializes artifacts to disk.
"""

import sys
import os
import json

# Add parent directory to python path
AI_SERVICE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if AI_SERVICE_DIR not in sys.path:
    sys.path.insert(0, AI_SERVICE_DIR)

from app.mongodb_data import get_market_price_records
from app.data_preparation import prepare_training_dataset
from app.ml_model import train_and_compare_models, save_model_and_metadata, MODEL_FILE_PATH, METADATA_FILE_PATH


def main():
    print("==================================================")
    print("HUMANLINK AI — MODEL TRAINING & COMPARISON")
    print("==================================================")

    # 1. Fetch records from MongoDB
    records = get_market_price_records(source_filter=None, limit=5000)
    gov_records = [r for r in records if "Government" in r.get("source", "")]
    
    if len(gov_records) > 0:
        target_records = gov_records
        source_label = "Government of India OGD / AGMARKNET"
    else:
        target_records = records
        source_label = "Development Sample Data"

    print(f"Data source: {source_label}")
    print(f"Total records retrieved: {len(target_records)}")

    if not target_records:
        print("\nSelected model: NONE")
        print("Status: INSUFFICIENT REAL DATA")
        return

    # 2. Data Preparation
    training_rows, summary = prepare_training_dataset(target_records)
    print(f"Usable training rows generated: {len(training_rows)}")

    if len(training_rows) < 2:
        print("\nSelected model: NONE")
        print("Status: INSUFFICIENT REAL DATA")
        return

    # 3. Train & Compare Random Forest vs XGBoost
    comp_results = train_and_compare_models(training_rows, data_source_label=source_label)

    rf_metrics = comp_results["randomForest"]
    xgb_metrics = comp_results["xgboost"]
    selected_name = comp_results["selected_model_name"]
    pipeline = comp_results["selected_pipeline"]

    print("\n--- PERFORMANCE METRICS ---")
    print(f"Total Rows: {comp_results['total_rows']} (Train: {comp_results['train_rows']}, Test: {comp_results['test_rows']})")
    print(f"Date Range: {comp_results['date_range']['start']} to {comp_results['date_range']['end']}")
    print(f"Random Forest MAE: ₹{rf_metrics['mae']:.2f}, RMSE: ₹{rf_metrics['rmse']:.2f}")
    print(f"XGBoost MAE:       ₹{xgb_metrics['mae']:.2f}, RMSE: ₹{xgb_metrics['rmse']:.2f}")
    print(f"Selected Model:    {selected_name}")

    # 4. Save Model & Metadata
    model_path, meta_path = save_model_and_metadata(pipeline, comp_results, MODEL_FILE_PATH, METADATA_FILE_PATH)
    print(f"\nTrained model saved to: {model_path}")
    print(f"Model metadata saved to: {meta_path}")

    print("\n--- STATUS ---")
    if comp_results["statistically_reliable"]:
        print("Status: PASS")
    else:
        print("Status: PASS WITH LIMITATION")
        print(f"Disclaimer: {comp_results['disclaimer']}")

    print("==================================================")


if __name__ == "__main__":
    main()
