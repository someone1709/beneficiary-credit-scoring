"""
Credit-Risk ML Pipeline
=======================
EXPERIMENTAL PROTOTYPE — SYNTHETIC DATA ONLY

This pipeline:
1. Generates 500 synthetic beneficiary records.
2. Creates a binary default_risk label using transparent, documented rules.
3. Trains a calibrated LogisticRegression classifier.
4. Evaluates on a held-out test set and logs metrics.
5. Saves the trained model to models/credit_risk.pkl.
6. At prediction time, produces a risk_score, risk_category, and SHAP explanations.

Limitations (must be disclosed in UI):
- Labels are synthetically generated, not from real default data.
- A model trained on synthetic labels does not estimate real-world default rates.
- Reported accuracy/AUC is on synthetic test data — not a real-world validation.
- Predictions should be treated as illustrative only.
"""
from __future__ import annotations

import logging
import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

try:
    import shap
    _SHAP_AVAILABLE = True
except ImportError:
    shap = None  # type: ignore
    _SHAP_AVAILABLE = False
from sklearn.calibration import CalibratedClassifierCV
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score, classification_report, roc_auc_score, f1_score
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

logger = logging.getLogger(__name__)

# ── Constants ────────────────────────────────────────────────────────────────
RISK_THRESHOLDS = {"LOW": 35.0, "HIGH": 65.0}  # LOW < 35, MEDIUM 35-65, HIGH >= 65
FEATURES = [
    "monthly_income", "monthly_expenses", "existing_emi",
    "loan_amount", "electricity_usage",
    "dti", "surplus", "expense_ratio",
    "repayment_good", "repayment_average", "repayment_poor",
]
MODEL_PATH = Path("models/credit_risk.pkl")
DATA_PATH = Path("data/synthetic_beneficiaries.csv")


def _generate_synthetic_data(n: int = 500, seed: int = 42) -> pd.DataFrame:
    """
    Generate synthetic beneficiary records.

    Label definition (transparent, documented):
        default_risk = 1 if:
            (dti > 0.60 AND repayment != 'good') OR surplus < 0 OR expense_ratio > 0.75
        else 0
    Then 10% random noise is injected to simulate real-world label uncertainty.
    """
    rng = np.random.default_rng(seed)

    monthly_income = rng.uniform(5000, 80000, n)
    monthly_expenses = monthly_income * rng.uniform(0.25, 0.85, n)
    existing_emi = monthly_income * rng.uniform(0.0, 0.30, n)
    loan_amount = rng.uniform(5000, 200000, n)
    electricity_usage = rng.uniform(20, 500, n)
    repayment_choices = rng.choice(["good", "average", "poor"], size=n, p=[0.45, 0.35, 0.20])

    estimated_new_emi = loan_amount / 24.0
    dti = (existing_emi + estimated_new_emi) / monthly_income
    surplus = monthly_income - monthly_expenses - existing_emi
    expense_ratio = monthly_expenses / monthly_income

    # Deterministic label from documented rules
    default_risk = (
        ((dti > 0.60) & (repayment_choices != "good"))
        | (surplus < 0)
        | (expense_ratio > 0.75)
    ).astype(int)

    # 10% label noise
    noise_mask = rng.random(n) < 0.10
    default_risk[noise_mask] = 1 - default_risk[noise_mask]

    df = pd.DataFrame({
        "monthly_income": monthly_income.round(2),
        "monthly_expenses": monthly_expenses.round(2),
        "existing_emi": existing_emi.round(2),
        "loan_amount": loan_amount.round(2),
        "electricity_usage": electricity_usage.round(2),
        "repayment_history": repayment_choices,
        "dti": dti.round(4),
        "surplus": surplus.round(2),
        "expense_ratio": expense_ratio.round(4),
        "repayment_good": (repayment_choices == "good").astype(int),
        "repayment_average": (repayment_choices == "average").astype(int),
        "repayment_poor": (repayment_choices == "poor").astype(int),
        "default_risk": default_risk,
    })

    DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(DATA_PATH, index=False)
    logger.info("Synthetic dataset written to %s (%d records)", DATA_PATH, n)
    return df


def _build_and_train(df: pd.DataFrame) -> tuple[Pipeline, np.ndarray, np.ndarray]:
    X = df[FEATURES]
    y = df["default_risk"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    base_lr = LogisticRegression(max_iter=1000, random_state=42, solver="lbfgs")
    calibrated = CalibratedClassifierCV(base_lr, method="isotonic", cv=5)

    pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("clf", calibrated),
    ])
    pipeline.fit(X_train, y_train)

    # Evaluation
    y_pred = pipeline.predict(X_test)
    y_prob = pipeline.predict_proba(X_test)[:, 1]
    logger.info("=== EXPERIMENTAL Model Evaluation (SYNTHETIC TEST SET) ===")
    logger.info("Accuracy: %.4f", accuracy_score(y_test, y_pred))
    logger.info("F1: %.4f", f1_score(y_test, y_pred))
    logger.info("ROC-AUC: %.4f", roc_auc_score(y_test, y_prob))
    logger.info(classification_report(y_test, y_pred))
    logger.info("NOTE: These metrics are on SYNTHETIC data. Not real-world validated.")

    return pipeline, X_test.values, y_test.values


class CreditRiskPipeline:
    """
    Wraps the trained credit-risk pipeline with prediction and SHAP explanation.
    """

    def __init__(self, sklearn_pipeline: Pipeline, feature_names: list[str]):
        self.pipeline = sklearn_pipeline
        self.feature_names = feature_names
        # SHAP explainer — only initialised if the shap package is installed.
        scaler = sklearn_pipeline.named_steps["scaler"]
        clf = sklearn_pipeline.named_steps["clf"]
        self._scaler = scaler
        self._shap_available = False
        if _SHAP_AVAILABLE:
            try:
                base_estimator = clf.calibrated_classifiers_[0].estimator
                self._explainer = shap.LinearExplainer(
                    base_estimator, shap.maskers.Independent(scaler.transform(
                        pd.DataFrame(np.zeros((1, len(feature_names))), columns=feature_names)
                    ))
                )
                self._shap_available = True
            except Exception:
                logger.warning("SHAP explainer could not be initialised; explanations will be rule-based.")

    def predict(self, request) -> dict:
        """
        Returns risk_score, risk_category, explanations, and optional shap_values.
        """
        features = self._extract_features(request)
        X = pd.DataFrame([features], columns=self.feature_names)

        prob_default = float(self.pipeline.predict_proba(X)[0, 1])
        risk_score = round(prob_default * 100, 2)

        if risk_score < RISK_THRESHOLDS["LOW"]:
            risk_category = "LOW"
        elif risk_score < RISK_THRESHOLDS["HIGH"]:
            risk_category = "MEDIUM"
        else:
            risk_category = "HIGH"

        explanations, shap_vals = self._explain(X, features, risk_score, request)

        return {
            "risk_score": risk_score,
            "risk_category": risk_category,
            "explanations": explanations,
            "shap_values": shap_vals,
        }

    def _extract_features(self, request) -> dict:
        estimated_new_emi = request.loan_amount / 24.0
        dti = (request.existing_emi + estimated_new_emi) / request.monthly_income
        surplus = request.monthly_income - request.monthly_expenses - request.existing_emi
        expense_ratio = request.monthly_expenses / request.monthly_income
        rh = request.repayment_history.lower()
        return {
            "monthly_income": request.monthly_income,
            "monthly_expenses": request.monthly_expenses,
            "existing_emi": request.existing_emi,
            "loan_amount": request.loan_amount,
            "electricity_usage": request.electricity_usage or 0.0,
            "dti": dti,
            "surplus": surplus,
            "expense_ratio": expense_ratio,
            "repayment_good": int(rh == "good"),
            "repayment_average": int(rh == "average"),
            "repayment_poor": int(rh == "poor"),
        }

    def _explain(self, X: pd.DataFrame, features: dict, risk_score: float, request) -> tuple[list[str], dict | None]:
        explanations = []
        shap_out = None

        # Human-readable rule-based explanations (always present)
        rh = request.repayment_history.lower()
        dti = features["dti"]
        surplus = features["surplus"]
        expense_ratio = features["expense_ratio"]

        if rh == "good":
            explanations.append("Repayment history (good) reduced predicted risk")
        elif rh == "average":
            explanations.append("Repayment history (average) had a neutral effect")
        else:
            explanations.append("Repayment history (poor) significantly increased predicted risk")

        if dti > 0.60:
            explanations.append(f"Debt-to-income ratio ({dti:.2f}) is high — above the 0.60 stress threshold")
        elif dti > 0.40:
            explanations.append(f"Debt-to-income ratio ({dti:.2f}) is moderate")
        else:
            explanations.append(f"Debt-to-income ratio ({dti:.2f}) is within a comfortable range")

        if surplus < 0:
            explanations.append(f"Monthly surplus is negative (₹{surplus:,.0f}) — income may not cover existing obligations")
        elif surplus < request.monthly_income * 0.10:
            explanations.append(f"Monthly surplus is thin (₹{surplus:,.0f})")
        else:
            explanations.append(f"Monthly surplus is positive (₹{surplus:,.0f})")

        if expense_ratio > 0.75:
            explanations.append(f"Expense ratio ({expense_ratio:.0%}) is very high")

        # SHAP values (supplementary — may be unavailable)
        if self._shap_available:
            try:
                X_scaled = self._scaler.transform(X)
                shap_values = self._explainer(X_scaled)
                shap_out = {
                    name: round(float(val), 4)
                    for name, val in zip(self.feature_names, shap_values.values[0])
                }
                top_factors = sorted(shap_out.items(), key=lambda x: abs(x[1]), reverse=True)[:3]
                shap_note = "Top model factors (SHAP, experimental): " + ", ".join(
                    f"{k.replace('_', ' ')} ({v:+.3f})" for k, v in top_factors
                )
                explanations.append(shap_note)
            except Exception:
                logger.debug("SHAP explanation failed — skipping")

        return explanations, shap_out

    def save(self, path: Path | None = None) -> None:
        path = path or MODEL_PATH
        path.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(self, path)
        logger.info("Model saved to %s", path)

    @classmethod
    def load(cls, path: Path) -> "CreditRiskPipeline":
        return joblib.load(path)


def train_and_save() -> None:
    """Entry point for training. Run as: python -m app.pipelines.credit_risk"""
    logging.basicConfig(level=logging.INFO)
    df = _generate_synthetic_data(n=500, seed=42)
    pipeline, _, _ = _build_and_train(df)
    wrapper = CreditRiskPipeline(pipeline, FEATURES)
    wrapper.save()
    logger.info("Training complete. Model ready for inference.")


if __name__ == "__main__":
    train_and_save()
