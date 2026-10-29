package com.creditscore.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * Internal DTO for the /predict response from the FastAPI ML service.
 * Field names match PredictResponse schema (snake_case).
 */
@Getter
@Setter
public class MlPredictResponse {

    @JsonProperty("beneficiary_id")
    private String beneficiaryId;

    @JsonProperty("risk_score")
    private BigDecimal riskScore;

    @JsonProperty("risk_category")
    private String riskCategory;

    @JsonProperty("income_bracket")
    private String incomeBracket;

    @JsonProperty("composite_score")
    private BigDecimal compositeScore;

    private String segment;

    @JsonProperty("segment_reason")
    private String segmentReason;

    private List<String> explanations;

    @JsonProperty("shap_values")
    private Map<String, Double> shapValues;

    private String disclaimer;
}
