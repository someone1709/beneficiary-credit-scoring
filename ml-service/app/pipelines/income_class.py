"""Rule-based income classification pipeline."""

BRACKETS = [
    (0, 14999.99, "LOW_INCOME"),
    (15000, 39999.99, "MID_INCOME"),
    (40000, float("inf"), "HIGH_INCOME"),
]


class IncomePipeline:
    """
    Assigns an income_bracket from the beneficiary's self-reported monthly_income.

    This is NOT a machine-learning model. It is a documented rule classifier.
    The bracket reflects claimed income — it does NOT constitute income verification.
    """

    def classify(self, monthly_income: float | None) -> dict:
        if monthly_income is None or monthly_income <= 0:
            return {
                "income_bracket": "UNKNOWN",
                "explanations": ["Income is missing or zero — bracket cannot be determined"],
            }

        for low, high, bracket in BRACKETS:
            if low <= monthly_income <= high:
                return {
                    "income_bracket": bracket,
                    "explanations": [
                        f"Self-reported monthly income of ₹{monthly_income:,.0f} falls in "
                        f"the {bracket.replace('_', ' ').title()} bracket "
                        f"(₹{low:,}–{'∞' if high == float('inf') else f'₹{high:,.0f}'})"
                    ],
                }

        return {
            "income_bracket": "UNKNOWN",
            "explanations": ["Income bracket could not be determined"],
        }
