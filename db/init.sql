-- Beneficiary Credit Scoring System — MySQL init script
-- Run once to create the database and tables.
-- With spring.jpa.hibernate.ddl-auto=update this is NOT strictly required,
-- but is kept as an explicit reference for the schema contract.

CREATE DATABASE IF NOT EXISTS credit_scoring CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE credit_scoring;

CREATE TABLE IF NOT EXISTS assessments (
    id                   BIGINT         NOT NULL AUTO_INCREMENT,
    beneficiary_id       VARCHAR(50)    NOT NULL,

    -- Inputs
    monthly_income       DECIMAL(12,2)  NOT NULL,
    monthly_expenses     DECIMAL(12,2)  NOT NULL,
    existing_emi         DECIMAL(12,2)  NOT NULL,
    loan_amount          DECIMAL(12,2)  NOT NULL,
    repayment_history    VARCHAR(20)    NOT NULL,
    electricity_usage    DECIMAL(8,2)   NULL,

    -- ML outputs
    risk_score           DECIMAL(6,2)   NULL,
    risk_category        VARCHAR(20)    NULL,
    income_bracket       VARCHAR(30)    NULL,
    composite_score      DECIMAL(6,2)   NULL,
    segment              VARCHAR(50)    NULL,
    segment_reason       TEXT           NULL,
    explanations         TEXT           NULL,

    -- Document verification
    verification_status  VARCHAR(30)    NOT NULL DEFAULT 'DEMO_UNVERIFIED',
    doc_filename         VARCHAR(255)   NULL,
    doc_original_name    VARCHAR(255)   NULL,
    doc_checksum         VARCHAR(64)    NULL,
    doc_mime_type        VARCHAR(100)   NULL,
    doc_size_bytes       BIGINT         NULL,
    doc_text_extracted   TINYINT(1)     NULL,

    -- Audit
    created_at           DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at           DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    version              INT            NOT NULL DEFAULT 0,

    PRIMARY KEY (id),
    INDEX idx_beneficiary_id (beneficiary_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE IF NOT EXISTS assessment_history (
    id             BIGINT      NOT NULL AUTO_INCREMENT,
    assessment_id  BIGINT      NOT NULL,
    snapshot       LONGTEXT    NOT NULL,
    scored_at      DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    version        INT         NOT NULL DEFAULT 0,

    PRIMARY KEY (id),
    INDEX idx_assessment_id (assessment_id),
    CONSTRAINT fk_history_assessment FOREIGN KEY (assessment_id)
        REFERENCES assessments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
