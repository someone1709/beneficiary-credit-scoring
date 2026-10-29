"""
Beneficiary Credit Scoring — FastAPI ML Service
================================================
IMPORTANT: All predictions are produced by a LogisticRegression classifier
trained on SYNTHETIC data. This is an experimental prototype intended for
educational and demonstration purposes only. Outputs must NOT be used as
real lending decisions.

Routes:
    GET  /health        → service status
    POST /predict       → credit-risk + income classification + explanations
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from app.schemas import PredictRequest, PredictResponse
from app.pipelines.credit_risk import CreditRiskPipeline
from app.pipelines.income_class import IncomePipeline

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── Global pipeline instances (loaded once at startup) ────────────────────────
credit_pipeline: CreditRiskPipeline | None = None
income_pipeline: IncomePipeline = IncomePipeline()   # rule-based, no model file


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load ML models at startup."""
    global credit_pipeline
    model_path = Path("models/credit_risk.pkl")
    if model_path.exists():
        credit_pipeline = CreditRiskPipeline.load(model_path)
        logger.info("Credit-risk model loaded from %s", model_path)
    else:
        logger.warning(
            "No trained model found at %s. "
            "Run 'python -m app.pipelines.credit_risk' to train first.",
            model_path,
        )
        credit_pipeline = None
    yield
    logger.info("ML service shutting down")


app = FastAPI(
    title="Credit Scoring ML Service",
    description=(
        "EXPERIMENTAL — Trained on synthetic data only. "
        "Not validated for real lending decisions."
    ),
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:8080"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    model_status = "loaded" if credit_pipeline is not None else "not_trained"
    return {
        "status": "ok",
        "service": "credit-scoring-ml",
        "model_status": model_status,
        "disclaimer": (
            "Experimental prototype. Predictions based on synthetic training data only."
        ),
    }


@app.post("/predict", response_model=PredictResponse)
def predict(request: PredictRequest):
    """
    Run credit-risk assessment and income classification.

    Returns risk_score, risk_category, income_bracket, composite_score,
    segment, and factor explanations.

    Raises 503 if the credit-risk model has not been trained yet.
    """
    if credit_pipeline is None:
        raise HTTPException(
            status_code=503,
            detail=(
                "Credit-risk model is not loaded. "
                "Please run the training script first: "
                "python -m app.pipelines.credit_risk"
            ),
        )

    try:
        risk_result = credit_pipeline.predict(request)
        income_result = income_pipeline.classify(request.monthly_income)
        composite, segment, segment_reason = _compute_composite(
            risk_result["risk_score"],
            risk_result["risk_category"],
            income_result["income_bracket"],
            request,
        )

        return PredictResponse(
            beneficiary_id=request.beneficiary_id,
            risk_score=risk_result["risk_score"],
            risk_category=risk_result["risk_category"],
            income_bracket=income_result["income_bracket"],
            composite_score=composite,
            segment=segment,
            segment_reason=segment_reason,
            explanations=risk_result["explanations"] + income_result["explanations"],
            shap_values=risk_result.get("shap_values"),
            disclaimer=(
                "EXPERIMENTAL: trained on 500 synthetic records. "
                "Not validated for real lending decisions."
            ),
        )
    except Exception as exc:
        logger.exception("Prediction error for beneficiary %s", request.beneficiary_id)
        raise HTTPException(status_code=500, detail=str(exc)) from exc


def _compute_composite(
    risk_score: float,
    risk_category: str,
    income_bracket: str,
    req: PredictRequest,
) -> tuple[float, str, str]:
    """
    Compute composite score and assign beneficiary segment.

    Formula (see scoring_rules.md for full documentation):
        base             = 100 - risk_score
        dti_penalty      = 20 × clamp(DTI - 0.40, 0, 1)
        repayment_adj    = +5 / 0 / -10
        surplus_bonus    = +3 / -5
        composite_score  = clamp(base - dti_penalty + repayment_adj + surplus_bonus, 0, 100)
    """
    # Derived ratios
    estimated_new_emi = req.loan_amount / 24.0
    dti = (req.existing_emi + estimated_new_emi) / req.monthly_income
    surplus = req.monthly_income - req.monthly_expenses - req.existing_emi

    base = 100.0 - risk_score

    dti_excess = max(dti - 0.40, 0.0)
    dti_penalty = 20.0 * min(dti_excess, 1.0)

    repayment_map = {"good": 5.0, "average": 0.0, "poor": -10.0}
    repayment_adj = repayment_map.get(req.repayment_history.lower(), 0.0)

    surplus_bonus = 3.0 if surplus > 0 else -5.0

    composite = round(max(0.0, min(100.0, base - dti_penalty + repayment_adj + surplus_bonus)), 2)

    # Segmentation — priority order documented in scoring_rules.md
    if risk_category == "HIGH":
        segment = "HIGH_RISK"
        reason = "risk_category is HIGH — assigned HIGH_RISK regardless of composite score"
    elif composite >= 65 and income_bracket == "HIGH_INCOME":
        segment = "PRIME"
        reason = "Composite score >= 65 with HIGH_INCOME bracket"
    elif composite >= 65 and income_bracket == "MID_INCOME":
        segment = "STANDARD_PLUS"
        reason = "Composite score >= 65 with MID_INCOME bracket"
    elif composite >= 65 and income_bracket == "LOW_INCOME":
        segment = "LOW_INCOME_PRIME"
        reason = "Composite score >= 65 with LOW_INCOME bracket — good behaviour, limited capacity"
    elif 45 <= composite < 65:
        segment = "STANDARD"
        reason = "Composite score 45–64 — moderate profile, standard due diligence recommended"
    elif 25 <= composite < 45:
        segment = "SUBPRIME"
        reason = "Composite score 25–44 — elevated risk, enhanced review recommended"
    else:
        segment = "HIGH_RISK"
        reason = f"Composite score {composite} < 25 — high risk profile"

    return composite, segment, reason
