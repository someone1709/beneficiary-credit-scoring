package com.creditscore.backend.dto;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * Request body for submitting a new beneficiary assessment.
 * Monetary values are in INR.
 */
@Getter
@Setter
public class AssessmentRequest {

    @NotBlank(message = "beneficiaryId is required")
    @Size(min = 1, max = 50, message = "beneficiaryId must be 1-50 characters")
    private String beneficiaryId;

    @NotNull(message = "monthlyIncome is required")
    @DecimalMin(value = "1.0", message = "monthlyIncome must be > 0")
    private BigDecimal monthlyIncome;

    @NotNull(message = "monthlyExpenses is required")
    @DecimalMin(value = "0.0", message = "monthlyExpenses must be >= 0")
    private BigDecimal monthlyExpenses;

    @NotNull(message = "existingEmi is required")
    @DecimalMin(value = "0.0", message = "existingEmi must be >= 0")
    private BigDecimal existingEmi;

    @NotNull(message = "loanAmount is required")
    @DecimalMin(value = "1.0", message = "loanAmount must be > 0")
    private BigDecimal loanAmount;

    @NotBlank(message = "repaymentHistory is required")
    @Pattern(regexp = "^(good|average|poor)$", message = "repaymentHistory must be good, average, or poor")
    private String repaymentHistory;

    @DecimalMin(value = "0.0", message = "electricityUsage must be >= 0")
    private BigDecimal electricityUsage; // optional
}
