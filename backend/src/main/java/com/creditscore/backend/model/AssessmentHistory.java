package com.creditscore.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Immutable history snapshot taken before every re-score.
 * The snapshot column stores the full Assessment JSON at that point in time.
 */
@Entity
@Table(name = "assessment_history")
@Getter
@Setter
@NoArgsConstructor
public class AssessmentHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "assessment_id", nullable = false)
    private Long assessmentId;

    @Column(name = "snapshot", columnDefinition = "LONGTEXT", nullable = false)
    private String snapshot; // full JSON snapshot of the assessment row

    @Column(name = "scored_at", nullable = false)
    private Instant scoredAt = Instant.now();

    @Column(name = "version", nullable = false)
    private int version;
}
