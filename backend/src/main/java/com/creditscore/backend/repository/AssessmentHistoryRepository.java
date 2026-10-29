package com.creditscore.backend.repository;

import com.creditscore.backend.model.AssessmentHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssessmentHistoryRepository extends JpaRepository<AssessmentHistory, Long> {
    List<AssessmentHistory> findByAssessmentIdOrderByScoredAtDesc(Long assessmentId);
}
