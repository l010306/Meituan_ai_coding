package com.meituan.club.recruitment_api.service;

public interface AiService {
    /**
     * Generate Job Description based on keywords
     */
    String generateJobDescription(String keywords);

    /**
     * Extract structured data (skills, experience summary) from raw resume text
     * Returns JSON string
     */
    String extractStructuredResumeInfo(String rawText);
}
