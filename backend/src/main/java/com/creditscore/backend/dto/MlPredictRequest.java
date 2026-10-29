package com.creditscore.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

/**
 * Internal DTO for the POST /predict call to the FastAPI ML service.
 * Field names match the FastAPI PredictRequest schema exactly (snake_case).
 */
@Getter
@Builder
public class MlPredictRequest {

    @JsonProperty("beneficiary_id")
    private String beneficiaryId;

    @JsonProperty("monthly_income")
    private BigDecimal monthlyIncome;

    @JsonProperty("monthly_expenses")
    private BigDecimal monthlyExpenses;

    @JsonProperty("existing_emi")
    private BigDecimal existingEmi;

    @JsonProperty("loan_amount")
    private BigDecimal loanAmount;

    @JsonProperty("repayment_history")
    private String repaymentHistory;

    @JsonProperty("electricity_usage")
    private BigDecimal electricityUsage;
}
