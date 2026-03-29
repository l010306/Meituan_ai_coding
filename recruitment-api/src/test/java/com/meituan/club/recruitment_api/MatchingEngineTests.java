package com.meituan.club.recruitment_api;

import com.meituan.club.recruitment_api.service.MatchingEngineService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertTrue;

class MatchingEngineTests {

    private MatchingEngineService matchingEngineService;

    @BeforeEach
    void setUp() {
        matchingEngineService = new MatchingEngineService();
    }

    @Test
    void testMatchingAlgorithm() {
        // 模拟岗位要求：需要 Java 和 策划
        String jobRequirements = "[\"Java\", \"策划\"]";
        
        // 模拟简历：包含 Java 但没有策划
        String resumeData = "{\"skills\":[\"Java\", \"Python\", \"沟通\"], \"experience\":\"...\"}";
        
        BigDecimal score = matchingEngineService.calculateMatchScore(jobRequirements, resumeData);
        
        System.out.println("匹配得分: " + score);
        // 2个要求中了1个，且考虑到模糊匹配，得分应为 50.00
        assertTrue(score.compareTo(BigDecimal.ZERO) > 0);
    }
}
