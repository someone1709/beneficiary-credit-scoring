"""
Pydantic schemas for the ML service API.
These define the JSON contract between the Spring Boot backend and FastAPI.
"""
from __future__ import annotations
from pydantic import BaseModel, Field, field_validator
from typing import Optional


class PredictRequest(BaseModel):
    """
    Input features for a beneficiary credit assessment.
    All monetary values are in INR (Indian Rupees).
    """
    beneficiary_id: str = Field(..., min_length=1, max_length=50)
    monthly_income: float = Field(..., gt=0, description="Monthly income in INR")
    monthly_expenses: float = Field(..., ge=0, description="Monthly living expenses in INR")
    existing_emi: float = Field(..., ge=0, description="Existing monthly EMI obligations in INR")
    loan_amount: float = Field(..., gt=0, description="Requested loan amount in INR")
    repayment_history: str = Field(..., description="One of: good, average, poor")
    electricity_usage: Optional[float] = Field(None, ge=0, description="Monthly kWh usage (optional)")

    @field_validator("repayment_history")
    @classmethod
    def validate_repayment(cls, v: str) -> str:
        allowed = {"good", "average", "poor"}
        if v.lower() not in allowed:
            raise ValueError(f"repayment_history must be one of {allowed}")
        return v.lower()

    model_config = {
        "json_schema_extra": {
            "example": {
                "beneficiary_id": "DEMO001",
                "monthly_income": 18000,
                "monthly_expenses": 9000,
                "existing_emi": 2000,
                "loan_amount": 25000,
                "repayment_history": "good",
                "electricity_usage": 120,
            }
        }
    }


class PredictResponse(BaseModel):
    """
    Assessment result returned by the ML service.
    All scores and categories carry a disclaimer that they are experimental.
    """
    beneficiary_id: str
    risk_score: float = Field(..., ge=0, le=100, description="0=no risk, 100=maximum predicted risk")
    risk_category: str = Field(..., description="LOW | MEDIUM | HIGH")
    income_bracket: str = Field(..., description="LOW_INCOME | MID_INCOME | HIGH_INCOME | UNKNOWN")
    composite_score: float = Field(..., ge=0, le=100, description="0=worst, 100=best creditworthiness")
    segment: str
    segment_reason: str = Field(..., description="Human-readable reason for segment assignment")
    explanations: list[str]
    shap_values: Optional[dict[str, float]] = None
    disclaimer: str = Field(
        default="EXPERIMENTAL: trained on synthetic data only. Not for real lending decisions."
    )
