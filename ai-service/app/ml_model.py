"""
HumanLink AI Service - Machine Learning Regression & Model Pipeline Module

Supports RandomForestRegressor and XGBRegressor pipelines, chronological
train/test splitting, metric evaluation (MAE/RMSE), model selection, and
joblib serialization with JSON metadata.
"""

import os
import json
import math
from datetime import datetime
from typing import List, Dict, Any, Tuple, Optional
import joblib

from sklearn.ensemble import RandomForestRegressor
try:
    from xgboost import XGBRegressor
    XGBOOST_AVAILABLE = True
except Exception as _xgb_err:
    XGBOOST_AVAILABLE = False
    XGBRegressor = None
    print(f"[ML_MODEL_NOTICE] XGBoost native runtime notice: {_xgb_err}. Pipeline will proceed with Random Forest.")

from sklearn.compose import ColumnTransformer

from sklearn.preprocessing import OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_absolute_error, mean_squared_error

# Column index mappings for 2D feature matrix
CATEGORICAL_INDICES = [0, 1, 2, 3]
NUMERIC_INDICES = [4, 5, 6, 7, 8, 9, 10]

FEATURE_NAMES = [
    "cropName",            # idx 0
    "marketName",          # idx 1
    "district",            # idx 2
    "state",               # idx 3
    "year",                # idx 4
    "month",               # idx 5
    "day",                 # idx 6
    "day_of_week",         # idx 7
    "previous_price",      # idx 8
    "price_2_records_ago", # idx 9
    "price_3_records_ago"  # idx 10
]

TARGET_FEATURE = "target_price"

MODEL_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "models"
)
MODEL_FILE_PATH = os.path.join(MODEL_DIR, "market_price_model.joblib")
METADATA_FILE_PATH = os.path.join(MODEL_DIR, "market_price_model_metadata.json")


def create_preprocessor() -> ColumnTransformer:
    """
    Constructs a ColumnTransformer for feature encoding and missing lag imputation.
    - Categorical: One-Hot Encoded (ignoring unknown categories)
    - Numeric & Lags: Median Imputation
    """
    categorical_transformer = OneHotEncoder(handle_unknown="ignore", sparse_output=False)
    numeric_transformer = SimpleImputer(strategy="median", fill_value=0.0)

    return ColumnTransformer(
        transformers=[
            ("cat", categorical_transformer, CATEGORICAL_INDICES),
            ("num", numeric_transformer, NUMERIC_INDICES)
        ]
    )


def create_random_forest_pipeline() -> Pipeline:
    """
    Constructs a Random Forest Regressor Pipeline.
    """
    preprocessor = create_preprocessor()
    model = RandomForestRegressor(
        n_estimators=100,
        random_state=42
    )
    return Pipeline(steps=[("preprocessor", preprocessor), ("regressor", model)])


def create_xgboost_pipeline() -> Pipeline:
    """
    Constructs an XGBoost Regressor Pipeline.
    """
    preprocessor = create_preprocessor()
    model = XGBRegressor(
        n_estimators=200,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        objective="reg:squarederror"
    )
    return Pipeline(steps=[("preprocessor", preprocessor), ("regressor", model)])


def extract_feature_vector(row: Dict[str, Any]) -> List[Any]:
    """
    Converts a single prepared row dictionary into a 1D feature list.
    MANDATORY RULE: target_price is strictly excluded to prevent target leakage.
    Missing numeric lag values are converted to float('nan') for median imputation.
    """
    p2 = row.get("price_2_records_ago")
    p3 = row.get("price_3_records_ago")

    p2_val = float(p2) if p2 is not None and not math.isnan(float(p2)) else float("nan")
    p3_val = float(p3) if p3 is not None and not math.isnan(float(p3)) else float("nan")

    return [
        str(row.get("cropName", row.get("crop", ""))),
        str(row.get("marketName", row.get("market", ""))),
        str(row.get("district", "")),
        str(row.get("state", "")),
        int(row.get("year", datetime.now().year)),
        int(row.get("month", datetime.now().month)),
        int(row.get("day", datetime.now().day)),
        int(row.get("day_of_week", datetime.now().weekday())),
        float(row.get("previous_price", 0.0)),
        p2_val,
        p3_val
    ]


def prepare_features_and_target(prepared_rows: List[Dict[str, Any]]) -> Tuple[List[List[Any]], List[float]]:
    """
    Extracts 2D feature matrix (X) and 1D target float array (y) from prepared training rows.
    """
    X = []
    y = []

    for row in prepared_rows:
        vector = extract_feature_vector(row)
        target_val = float(row[TARGET_FEATURE])

        X.append(vector)
        y.append(target_val)

    return X, y


def train_and_compare_models(prepared_rows: List[Dict[str, Any]], data_source_label: str = "Government of India OGD / AGMARKNET") -> Dict[str, Any]:
    """
    Trains and compares Random Forest vs XGBoost models on prepared dataset rows.
    Performs chronological train/test split (80% train, 20% test).
    Selects model based on lower MAE.
    """
    total_rows = len(prepared_rows)
    if total_rows < 2:
        return {
            "status": "error",
            "message": "Insufficient data for ML model comparison (less than 2 usable rows).",
            "selected_model": None
        }

    # Sort chronologically by date
    sorted_rows = sorted(prepared_rows, key=lambda r: r.get("date", ""))
    X, y = prepare_features_and_target(sorted_rows)

    # Chronological Train/Test Split (80% train, 20% test)
    split_idx = max(1, int(total_rows * 0.8))
    if split_idx >= total_rows:
        split_idx = total_rows - 1

    X_train, X_test = X[:split_idx], X[split_idx:]
    y_train, y_test = y[:split_idx], y[split_idx:]

    # 1. Train & Evaluate Random Forest
    rf_pipeline = create_random_forest_pipeline()
    rf_pipeline.fit(X_train, y_train)
    rf_pred = rf_pipeline.predict(X_test)
    rf_mae = float(mean_absolute_error(y_test, rf_pred))
    rf_rmse = float(math.sqrt(mean_squared_error(y_test, rf_pred)))

    # 2. Train & Evaluate XGBoost (if native library available)
    xgb_pipeline = None
    xgb_mae = float("inf")
    xgb_rmse = float("inf")
    xgb_available = False

    if XGBOOST_AVAILABLE:
        try:
            xgb_pipeline = create_xgboost_pipeline()
            xgb_pipeline.fit(X_train, y_train)
            xgb_pred = xgb_pipeline.predict(X_test)
            xgb_mae = float(mean_absolute_error(y_test, xgb_pred))
            xgb_rmse = float(math.sqrt(mean_squared_error(y_test, xgb_pred)))
            xgb_available = True
        except Exception as _xgb_err:
            print(f"[ML_MODEL_NOTICE] XGBoost training exception: {_xgb_err}. Falling back to Random Forest.")
            xgb_mae = float("inf")
            xgb_rmse = float("inf")

    is_statistically_reliable = total_rows >= 30 and len(X_test) >= 5

    # 3. Select Best Model
    if not xgb_available or rf_mae < xgb_mae or (math.isclose(rf_mae, xgb_mae) and rf_rmse <= xgb_rmse):
        best_name = "RandomForest"
        best_pipeline = rf_pipeline
        best_mae = rf_mae
        best_rmse = rf_rmse
    else:
        best_name = "XGBoost"
        best_pipeline = xgb_pipeline
        best_mae = xgb_mae
        best_rmse = xgb_rmse


    date_start = sorted_rows[0].get("date", "")
    date_end = sorted_rows[-1].get("date", "")

    disclaimer = (
        "Model trained and evaluated on chronological dataset split."
        if is_statistically_reliable
        else "Real government data pipeline and model training infrastructure are working, but the available historical dataset is insufficient for reliable model-performance conclusions."
    )

    results = {
        "status": "success",
        "statistically_reliable": is_statistically_reliable,
        "selected_model_name": best_name,
        "selected_pipeline": best_pipeline,
        "total_rows": total_rows,
        "train_rows": len(X_train),
        "test_rows": len(X_test),
        "date_range": {"start": date_start, "end": date_end},
        "data_source": data_source_label,
        "randomForest": {
            "mae": rf_mae,
            "rmse": rf_rmse
        },
        "xgboost": {
            "mae": xgb_mae,
            "rmse": xgb_rmse
        },
        "selected_metrics": {
            "mae": best_mae,
            "rmse": best_rmse
        },
        "disclaimer": disclaimer
    }

    return results


def save_model_and_metadata(
    pipeline: Pipeline,
    metadata_dict: Dict[str, Any],
    model_path: str = MODEL_FILE_PATH,
    metadata_path: str = METADATA_FILE_PATH
) -> Tuple[str, str]:
    """
    Saves the trained pipeline and metadata JSON to disk.
    Ensures secrets are NEVER written to metadata.
    """
    os.makedirs(os.path.dirname(model_path), exist_ok=True)
    
    # Save joblib pipeline
    joblib.dump(pipeline, model_path)

    # Clean metadata dict (strip un-serializable pipeline object)
    clean_metadata = {k: v for k, v in metadata_dict.items() if k != "selected_pipeline"}
    clean_metadata["trainedAt"] = datetime.utcnow().isoformat() + "Z"

    with open(metadata_path, "w") as f:
        json.dump(clean_metadata, f, indent=2)

    return model_path, metadata_path


def load_model_and_metadata(
    model_path: str = MODEL_FILE_PATH,
    metadata_path: str = METADATA_FILE_PATH
) -> Tuple[Optional[Pipeline], Optional[Dict[str, Any]]]:
    """
    Loads trained pipeline and metadata JSON from disk.
    """
    pipeline = joblib.load(model_path) if os.path.exists(model_path) else None
    metadata = None
    if os.path.exists(metadata_path):
        with open(metadata_path, "r") as f:
            metadata = json.load(f)

    return pipeline, metadata


def predict_market_price(pipeline: Pipeline, feature_dict: Dict[str, Any]) -> float:
    """
    Makes a single price prediction using a trained pipeline and input feature dict.
    """
    vector = extract_feature_vector(feature_dict)
    prediction = pipeline.predict([vector])
    return float(prediction[0])
