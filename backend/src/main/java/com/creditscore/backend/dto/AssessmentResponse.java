package com.creditscore.backend.dto;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/**
 * Response DTO returned by all assessment endpoints.
 */
@Getter
@Builder
public class AssessmentResponse {
    private Long id;
    private String beneficiaryId;

    // Inputs
    private BigDecimal monthlyIncome;
    private BigDecimal monthlyExpenses;
    private BigDecimal existingEmi;
    private BigDecimal loanAmount;
    private String repaymentHistory;
    private BigDecimal electricityUsage;

    // ML outputs
    private BigDecimal riskScore;
    private String riskCategory;
    private String incomeBracket;
    private BigDecimal compositeScore;
    private String segment;
    private String segmentReason;
    private List<String> explanations;

    // Document verification
    private String verificationStatus;
    private String docOriginalName;
    private String docMimeType;
    private Long docSizeBytes;
    private Boolean docTextExtracted;

    // Audit
    private Instant createdAt;
    private Instant updatedAt;
    private int version;

    private String disclaimer;
}
