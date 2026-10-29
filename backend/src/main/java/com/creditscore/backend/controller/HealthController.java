package com.creditscore.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

/**
 * Simple health check endpoint. Returns service status and timestamp.
 * Spring Actuator also exposes /actuator/health but this custom endpoint
 * matches our documented API contract at /api/health.
 */
@RestController
@RequestMapping("/api")
public class HealthController {

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "ok",
                "service", "credit-scoring-backend",
                "timestamp", Instant.now().toString()
        ));
    }
}
