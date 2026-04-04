"""
ml_service.py — RESTful Sepsis Prediction Service
====================================================
Implements the stateful, carry-forward sepsis prediction workflow
for the Wardian backend.

Intended consumer: a future route that forwards patient history
(as a list of SepsisObservation dicts) plus a new partial observation
from the UI.

Returns a JSON-serialisable dict so the route layer can do
`return JSONResponse(result)` with no further transformation.
"""

from __future__ import annotations

import json
import os
import sys
from typing import Optional, List, Dict, Any

import joblib
import numpy as np
import pandas as pd
import polars as pl
import xgboost as xgb

# ---------------------------------------------------------------------------
# Path wiring – locate the ml_module root and backend root
# ---------------------------------------------------------------------------
_SRC_DIR     = os.path.dirname(os.path.abspath(__file__))          # .../ml_module/src
_ML_ROOT     = os.path.dirname(_SRC_DIR)                           # .../ml_module
_BACKEND_ROOT = os.path.dirname(_ML_ROOT)                           # .../backend
_ARTIFACTS   = os.path.join(_ML_ROOT, "artifacts")

if _SRC_DIR not in sys.path:
    sys.path.insert(0, _SRC_DIR)
if _BACKEND_ROOT not in sys.path:
    sys.path.insert(0, _BACKEND_ROOT)

from features import run_pipeline, VITALS, LABS  # noqa: E402
from schemas.patient import PatientVitalResponseSchema, PatientVitalBase  # noqa: E402


# SepsisObservation is now merged into PatientVital schema and model.


# ---------------------------------------------------------------------------
# 2. Asset loading — singleton pattern so model is loaded once at startup
# ---------------------------------------------------------------------------

class _MLAssets:
    """Lazily loaded, cached ML artifacts."""

    _model: Optional[xgb.XGBClassifier] = None
    _feature_columns: Optional[List[str]] = None
    _threshold: Optional[float] = None
    _explainer = None

    @classmethod
    def load(cls) -> "_MLAssets":
        if cls._model is None:
            model_path     = os.path.join(_ARTIFACTS, "xgb_sepsis_model.json")
            feat_path      = os.path.join(_ARTIFACTS, "feature_columns.json")
            thresh_path    = os.path.join(_ARTIFACTS, "threshold_sweep.json")
            explainer_path = os.path.join(_ARTIFACTS, "shap_explainer.joblib")

            missing = [p for p in [model_path, feat_path, thresh_path, explainer_path]
                       if not os.path.exists(p)]
            if missing:
                raise FileNotFoundError(
                    f"ML artifacts missing: {missing}. Run train.py first."
                )

            cls._model = xgb.XGBClassifier()
            cls._model.load_model(model_path)

            with open(feat_path, "r") as f:
                cls._feature_columns = json.load(f)

            with open(thresh_path, "r") as f:
                cls._threshold = json.load(f).get("best_threshold", 0.75)

            cls._explainer = joblib.load(explainer_path)

        return cls  # Return the class itself as a namespace (singleton)


# ---------------------------------------------------------------------------
# 3. Internal helpers
# ---------------------------------------------------------------------------

def _observations_to_polars(observations: List[PatientVitalBase]) -> pl.DataFrame:
    """
    Converts a list of PatientVitalBase/ResponseSchema objects into a Polars DataFrame,
    renaming 'patient_id' / 'hour' to the pipeline-expected 'Patient_ID' / 'Hour'.
    Excludes non-clinical database fields like 'id' and 'timestamp'.
    """
    rows = []
    for obs in observations:
        d = obs.model_dump()
        d["Patient_ID"] = str(d.pop("patient_id"))
        d["Hour"] = d.pop("hour")
        # Exclude metadata fields from the ML dataframe
        d.pop("id", None)
        d.pop("timestamp", None)
        rows.append(d)

    df = pl.DataFrame(rows).sort(["Patient_ID", "Hour"])

    # Cast all clinical columns to Float64 (they may be None → null)
    # Note: Age and Gender are typically injected by the caller if missing
    clinical_cols = VITALS + LABS + ["Age", "Gender", "Unit1", "Unit2", "HospAdmTime", "ICULOS"]
    df = df.with_columns([
        pl.col(c).cast(pl.Float64, strict=False)
        for c in clinical_cols
        if c in df.columns
    ])
    return df.sort(["Patient_ID", "Hour"])


def _carry_forward(
    last_known: PatientVitalResponseSchema,
    new_input: Dict[str, Any],
) -> PatientVitalBase:
    """
    Builds a new PatientVital for the incoming UI update.

    Strategy:
        - Start from the last known observation (carry-forward semantics).
        - Override with any explicitly provided values from `new_input`.
        - Advance `hour` by 1 and update `ICULOS` accordingly.
    """
    last_dict = last_known.model_dump()

    # Build the new row from carry-forward base
    new_row = {k: v for k, v in last_dict.items()}
    new_row["hour"] = (last_known.hour or 0.0) + 1.0
    new_row["ICULOS"] = (last_known.ICULOS or last_known.hour or 0.0) + 1.0

    # Apply UI overrides (only recognised field names are accepted)
    valid_fields = set(PatientVitalBase.model_fields.keys())
    for key, value in new_input.items():
        if key in valid_fields and value is not None:
            try:
                new_row[key] = float(value)
            except (ValueError, TypeError):
                continue

    return PatientVitalBase(**new_row)


def _build_prediction_payload(
    processed_df: pl.DataFrame,
    feature_columns: List[str],
) -> np.ndarray:
    """Extracts the last (newest) row as a float32 numpy array for XGBoost."""
    # Ensure all required feature columns exist
    for col in feature_columns:
        if col not in processed_df.columns:
            processed_df = processed_df.with_columns(pl.lit(0.0).alias(col))

    X = processed_df.tail(1).select(feature_columns).to_pandas().values.astype(np.float32)
    return np.nan_to_num(X, nan=0.0, posinf=0.0, neginf=0.0)


# ---------------------------------------------------------------------------
# 4. Public service class
# ---------------------------------------------------------------------------

class MLService:
    """
    Stateless service layer for sepsis risk prediction.

    Usage (future route):
        service = MLService()
        result  = service.predict(patient_id, history_observations, new_observation_dict)
        return JSONResponse(result)
    """

    def predict(
        self,
        patient_id: str,
        history: List[PatientVitalResponseSchema],
        new_observation: Dict[str, Any],
        age: Optional[float] = None,
        gender: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Run a forward prediction given a patient's history + a new UI observation.

        Parameters
        ----------
        patient_id:
            The patient's string identifier.
        history:
            Ordered list of PatientVitalResponseSchema objects representing the last
            ≤24 hours of stored clinical data for this patient.
        new_observation:
            Dict of field_name → value pairs from the UI update.
        Age:
            Patient's current age (injected into rows for ML compatibility).
        Gender:
            Patient's gender (1=Male, 0=Female).

        Returns
        -------
        dict with keys:
            patient_id          : str
            hour                : float — ICU hour of the new observation
            previous_probability: float — probability at end of stored history
            current_probability : float — probability after the new observation
            risk_delta          : float — signed change (positive = worsening)
            risk_trend          : "RISING" | "STABLE" | "IMPROVING"
            is_sepsis_alert     : bool  — True if probability ≥ threshold
            threshold_used      : float
            top_drivers         : list[dict] — top 5 SHAP-ranked features
        """
        assets = _MLAssets.load()

        if not history:
            raise ValueError("Patient history must contain at least one observation.")

        # ── Step 1: Baseline probability on existing history ────────────────
        history_df = _observations_to_polars(history)
        
        # Inject static context if provided
        if age is not None:
             history_df = history_df.with_columns(pl.lit(age).alias("Age"))
        if gender is not None:
             history_df = history_df.with_columns(pl.lit(gender).alias("Gender"))

        history_processed = run_pipeline(history_df)
        X_base = _build_prediction_payload(history_processed, assets._feature_columns)
        previous_probability = float(assets._model.predict_proba(X_base)[0, 1])

        # ── Step 2: Build carry-forward new observation ──────────────────────
        new_obs = _carry_forward(history[-1], new_observation)

        # ── Step 3: Append and rerun the full pipeline ───────────────────────
        new_obs_df = _observations_to_polars([new_obs])
        
        # Ensure Age/Gender consistency in the single-row dataframe too
        if age is not None:
             new_obs_df = new_obs_df.with_columns(pl.lit(age).alias("Age"))
        if gender is not None:
             new_obs_df = new_obs_df.with_columns(pl.lit(gender).alias("Gender"))

        combined_df = pl.concat([history_df, new_obs_df])
        combined_processed = run_pipeline(combined_df)

        X_new = _build_prediction_payload(combined_processed, assets._feature_columns)
        current_probability = float(assets._model.predict_proba(X_new)[0, 1])

        # ── Step 4: Delta & alert logic ──────────────────────────────────────
        risk_delta = current_probability - previous_probability

        if risk_delta > 0.05:
            risk_trend = "RISING"
        elif risk_delta < -0.05:
            risk_trend = "IMPROVING"
        else:
            risk_trend = "STABLE"

        is_sepsis_alert = current_probability >= assets._threshold

        # ── Step 5: SHAP explainability ──────────────────────────────────────
        shap_values = assets._explainer.shap_values(X_new)
        if isinstance(shap_values, list):
            shap_values = shap_values[1]

        feature_impacts = sorted(
            zip(assets._feature_columns, shap_values[0]),
            key=lambda x: abs(x[1]),
            reverse=True,
        )

        top_drivers = [
            {
                "feature":     feat,
                "shap_impact": round(float(val), 5),
                "direction":   "stressing" if val > 0 else "protective",
            }
            for feat, val in feature_impacts[:5]
        ]

        # ── Step 6: Compose response ─────────────────────────────────────────
        return {
            "patient_id":           patient_id,
            "hour":                 new_obs.hour,
            "previous_probability": round(previous_probability, 4),
            "current_probability":  round(current_probability, 4),
            "risk_delta":           round(risk_delta, 4),
            "risk_trend":           risk_trend,
            "is_sepsis_alert":      is_sepsis_alert,
            "threshold_used":       assets._threshold,
            "top_drivers":          top_drivers,
        }
