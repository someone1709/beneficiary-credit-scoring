package com.creditscore.backend.service;

import com.creditscore.backend.dto.*;
import com.creditscore.backend.model.Assessment;
import com.creditscore.backend.model.AssessmentHistory;
import com.creditscore.backend.repository.AssessmentHistoryRepository;
import com.creditscore.backend.repository.AssessmentRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.*;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Collections;
import java.util.HexFormat;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AssessmentService {

    private final AssessmentRepository assessmentRepository;
    private final AssessmentHistoryRepository historyRepository;
    private final WebClient mlWebClient;
    private final ObjectMapper objectMapper;

    @Value("${upload.dir:./uploads}")
    private String uploadDir;

    private static final String DISCLAIMER = "EXPERIMENTAL: trained on synthetic data only. Not for real lending decisions.";

    // ── Create ──────────────────────────────────────────────────────────────────

    @Transactional
    public AssessmentResponse createAssessment(AssessmentRequest req, MultipartFile file) {
        Assessment entity = mapRequestToEntity(req, new Assessment());

        // Handle optional document upload
        if (file != null && !file.isEmpty()) {
            storeDocument(entity, file);
        }

        // Call ML service
        MlPredictResponse ml = callMlService(entity);
        applyMlResult(entity, ml);

        Assessment saved = assessmentRepository.save(entity);
        log.info("Saved assessment id={} beneficiary={} segment={}",
                saved.getId(), saved.getBeneficiaryId(), saved.getSegment());
        return toResponse(saved);
    }

    // ── Re-score ────────────────────────────────────────────────────────────────

    @Transactional
    public AssessmentResponse rescoreAssessment(Long id) {
        Assessment entity = assessmentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Assessment not found: " + id));

        // Snapshot current state
        snapshotHistory(entity);

        // Re-call ML (inputs unchanged, model may differ)
        MlPredictResponse ml = callMlService(entity);
        applyMlResult(entity, ml);
        entity.setVersion(entity.getVersion() + 1);
        entity.setUpdatedAt(Instant.now());

        Assessment saved = assessmentRepository.save(entity);
        log.info("Re-scored assessment id={} new_segment={}", saved.getId(), saved.getSegment());
        return toResponse(saved);
    }

    // ── Queries ─────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<AssessmentResponse> findAll() {
        return assessmentRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AssessmentResponse findById(Long id) {
        return assessmentRepository.findById(id)
                .map(this::toResponse)
                .orElseThrow(() -> new EntityNotFoundException("Assessment not found: " + id));
    }

    @Transactional(readOnly = true)
    public List<AssessmentResponse> findByBeneficiaryId(String beneficiaryId) {
        return assessmentRepository.findByBeneficiaryIdOrderByCreatedAtDesc(beneficiaryId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    // ── Internal helpers ────────────────────────────────────────────────────────

    private MlPredictResponse callMlService(Assessment entity) {
        MlPredictRequest mlReq = MlPredictRequest.builder()
                .beneficiaryId(entity.getBeneficiaryId())
                .monthlyIncome(entity.getMonthlyIncome())
                .monthlyExpenses(entity.getMonthlyExpenses())
                .existingEmi(entity.getExistingEmi())
                .loanAmount(entity.getLoanAmount())
                .repaymentHistory(entity.getRepaymentHistory())
                .electricityUsage(entity.getElectricityUsage())
                .build();

        try {
            return mlWebClient.post()
                    .uri("/predict")
                    .bodyValue(mlReq)
                    .retrieve()
                    .bodyToMono(MlPredictResponse.class)
                    .block();
        } catch (WebClientResponseException ex) {
            log.error("ML service error {}: {}", ex.getStatusCode(), ex.getResponseBodyAsString());
            throw ex;
        }
    }

    private Assessment mapRequestToEntity(AssessmentRequest req, Assessment entity) {
        entity.setBeneficiaryId(req.getBeneficiaryId());
        entity.setMonthlyIncome(req.getMonthlyIncome());
        entity.setMonthlyExpenses(req.getMonthlyExpenses());
        entity.setExistingEmi(req.getExistingEmi());
        entity.setLoanAmount(req.getLoanAmount());
        entity.setRepaymentHistory(req.getRepaymentHistory());
        entity.setElectricityUsage(req.getElectricityUsage());
        return entity;
    }

    private void applyMlResult(Assessment entity, MlPredictResponse ml) {
        entity.setRiskScore(ml.getRiskScore());
        entity.setRiskCategory(ml.getRiskCategory());
        entity.setIncomeBracket(ml.getIncomeBracket());
        entity.setCompositeScore(ml.getCompositeScore());
        entity.setSegment(ml.getSegment());
        entity.setSegmentReason(ml.getSegmentReason());
        try {
            entity.setExplanations(objectMapper.writeValueAsString(ml.getExplanations()));
        } catch (JsonProcessingException e) {
            entity.setExplanations("[]");
        }
    }

    private void storeDocument(Assessment entity, MultipartFile file) {
        try {
            Path dir = Paths.get(uploadDir);
            Files.createDirectories(dir);
            String storedName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
            Path dest = dir.resolve(storedName);
            Files.copy(file.getInputStream(), dest, StandardCopyOption.REPLACE_EXISTING);

            byte[] bytes = Files.readAllBytes(dest);
            String checksum = HexFormat.of().formatHex(
                    MessageDigest.getInstance("SHA-256").digest(bytes));

            entity.setDocFilename(storedName);
            entity.setDocOriginalName(file.getOriginalFilename());
            entity.setDocChecksum(checksum);
            entity.setDocMimeType(file.getContentType());
            entity.setDocSizeBytes(file.getSize());
            entity.setDocTextExtracted(false);
            entity.setVerificationStatus("DEMO_UPLOADED");
        } catch (Exception e) {
            log.warn("Document storage failed: {}", e.getMessage());
            entity.setVerificationStatus("DEMO_UPLOAD_FAILED");
        }
    }

    private void snapshotHistory(Assessment entity) {
        AssessmentHistory hist = new AssessmentHistory();
        hist.setAssessmentId(entity.getId());
        hist.setVersion(entity.getVersion());
        hist.setScoredAt(Instant.now());
        try {
            ObjectMapper snap = new ObjectMapper()
                    .registerModule(new JavaTimeModule())
                    .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
            hist.setSnapshot(snap.writeValueAsString(toResponse(entity)));
        } catch (JsonProcessingException e) {
            hist.setSnapshot("{}");
        }
        historyRepository.save(hist);
    }

    private AssessmentResponse toResponse(Assessment e) {
        List<String> explanations;
        try {
            if (e.getExplanations() != null && !e.getExplanations().isBlank()) {
                explanations = objectMapper.readValue(e.getExplanations(),
                        new TypeReference<List<String>>() {
                        });
            } else {
                explanations = Collections.emptyList();
            }
        } catch (JsonProcessingException ex) {
            explanations = Collections.emptyList();
        }

        return AssessmentResponse.builder()
                .id(e.getId())
                .beneficiaryId(e.getBeneficiaryId())
                .monthlyIncome(e.getMonthlyIncome())
                .monthlyExpenses(e.getMonthlyExpenses())
                .existingEmi(e.getExistingEmi())
                .loanAmount(e.getLoanAmount())
                .repaymentHistory(e.getRepaymentHistory())
                .electricityUsage(e.getElectricityUsage())
                .riskScore(e.getRiskScore())
                .riskCategory(e.getRiskCategory())
                .incomeBracket(e.getIncomeBracket())
                .compositeScore(e.getCompositeScore())
                .segment(e.getSegment())
                .segmentReason(e.getSegmentReason())
                .explanations(explanations)
                .verificationStatus(e.getVerificationStatus())
                .docOriginalName(e.getDocOriginalName())
                .docMimeType(e.getDocMimeType())
                .docSizeBytes(e.getDocSizeBytes())
                .docTextExtracted(e.getDocTextExtracted())
                .createdAt(e.getCreatedAt())
                .updatedAt(e.getUpdatedAt())
                .version(e.getVersion())
                .disclaimer(DISCLAIMER)
                .build();
    }
}
