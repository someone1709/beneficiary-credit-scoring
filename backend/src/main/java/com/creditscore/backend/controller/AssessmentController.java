package com.creditscore.backend.controller;

import com.creditscore.backend.dto.AssessmentRequest;
import com.creditscore.backend.dto.AssessmentResponse;
import com.creditscore.backend.service.AssessmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

/**
 * REST controller for beneficiary credit assessments.
 *
 * All responses include a disclaimer that outputs are experimental
 * and based on synthetic training data.
 */
@RestController
@RequestMapping("/api/assessments")
@RequiredArgsConstructor
public class AssessmentController {

    private final AssessmentService assessmentService;

    /**
     * POST /api/assessments
     * Submit a new beneficiary for credit assessment.
     * Accepts multipart form (fields + optional document file).
     */
    @PostMapping(consumes = { MediaType.MULTIPART_FORM_DATA_VALUE, MediaType.APPLICATION_JSON_VALUE })
    public ResponseEntity<AssessmentResponse> create(
            @Valid @ModelAttribute AssessmentRequest request,
            @RequestPart(value = "document", required = false) MultipartFile document) {
        AssessmentResponse response = assessmentService.createAssessment(request, document);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * GET /api/assessments
     * List all assessments, newest first.
     */
    @GetMapping
    public ResponseEntity<List<AssessmentResponse>> listAll() {
        return ResponseEntity.ok(assessmentService.findAll());
    }

    /**
     * GET /api/assessments/{id}
     * Retrieve a single assessment by database ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<AssessmentResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(assessmentService.findById(id));
    }

    /**
     * GET /api/assessments/beneficiary/{beneficiaryId}
     * Retrieve all assessments for a given beneficiary ID.
     */
    @GetMapping("/beneficiary/{beneficiaryId}")
    public ResponseEntity<List<AssessmentResponse>> getByBeneficiary(
            @PathVariable String beneficiaryId) {
        return ResponseEntity.ok(assessmentService.findByBeneficiaryId(beneficiaryId));
    }

    /**
     * POST /api/assessments/{id}/rescore
     * Re-run ML scoring on an existing assessment (inputs unchanged).
     * Snapshots the current score before updating.
     */
    @PostMapping("/{id}/rescore")
    public ResponseEntity<AssessmentResponse> rescore(@PathVariable Long id) {
        return ResponseEntity.ok(assessmentService.rescoreAssessment(id));
    }

    /**
     * POST /api/assessments/json
     * Convenience endpoint accepting pure JSON (no file upload).
     */
    @PostMapping(value = "/json", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<AssessmentResponse> createJson(
            @Valid @RequestBody AssessmentRequest request) {
        AssessmentResponse response = assessmentService.createAssessment(request, null);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
