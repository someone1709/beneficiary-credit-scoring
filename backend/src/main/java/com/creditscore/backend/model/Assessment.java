package com.creditscore.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * JPA entity mapping to the `assessments` table.
 * Monetary values are in INR. Never used for real lending decisions.
 */
@Entity
@Table(name = "assessments")
@Getter
@Setter
@NoArgsConstructor
public class Assessment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "beneficiary_id", nullable = false, length = 50)
    private String beneficiaryId;

    // ── Input fields ──────────────────────────────────────────────────────────
    @Column(name = "monthly_income", nullable = false, precision = 12, scale = 2)
    private BigDecimal monthlyIncome;

    @Column(name = "monthly_expenses", nullable = false, precision = 12, scale = 2)
    private BigDecimal monthlyExpenses;

    @Column(name = "existing_emi", nullable = false, precision = 12, scale = 2)
    private BigDecimal existingEmi;

    @Column(name = "loan_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal loanAmount;

    @Column(name = "repayment_history", nullable = false, length = 20)
    private String repaymentHistory;

    @Column(name = "electricity_usage", precision = 8, scale = 2)
    private BigDecimal electricityUsage;

    // ── ML outputs ────────────────────────────────────────────────────────────
    @Column(name = "risk_score", precision = 6, scale = 2)
    private BigDecimal riskScore;

    @Column(name = "risk_category", length = 20)
    private String riskCategory;

    @Column(name = "income_bracket", length = 30)
    private String incomeBracket;

    @Column(name = "composite_score", precision = 6, scale = 2)
    private BigDecimal compositeScore;

    @Column(name = "segment", length = 50)
    private String segment;

    @Column(name = "segment_reason", columnDefinition = "TEXT")
    private String segmentReason;

    @Column(name = "explanations", columnDefinition = "TEXT")
    private String explanations; // JSON array of strings

    // ── Document verification ─────────────────────────────────────────────────
    @Column(name = "verification_status", nullable = false, length = 30)
    private String verificationStatus = "DEMO_UNVERIFIED";

    @Column(name = "doc_filename", length = 255)
    private String docFilename;

    @Column(name = "doc_original_name", length = 255)
    private String docOriginalName;

    @Column(name = "doc_checksum", length = 64)
    private String docChecksum;

    @Column(name = "doc_mime_type", length = 100)
    private String docMimeType;

    @Column(name = "doc_size_bytes")
    private Long docSizeBytes;

    @Column(name = "doc_text_extracted")
    private Boolean docTextExtracted;

    // ── Audit ─────────────────────────────────────────────────────────────────
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @Column(name = "version", nullable = false)
    private int version = 0;

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
