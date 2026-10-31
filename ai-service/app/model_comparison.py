"""
HumanLink AI Service - Model Comparison & Selection Module

Performs structured comparison between Random Forest Regressor and XGBoost Regressor
metrics (MAE and RMSE), selecting the best performing model.
"""

from typing import Dict, Any
from app.ml_model import train_and_compare_models


def compare_and_select_model(prepared_rows: list, data_source_label: str = "Government of India OGD / AGMARKNET") -> Dict[str, Any]:
    """
    Executes model training and comparison between Random Forest and XGBoost.
    Returns comparison metrics and model selection evaluation.
    """
    results = train_and_compare_models(prepared_rows, data_source_label)
    return results
