package com.meituan.club.recruitment_api.service;

import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.JSONArray;
import com.alibaba.fastjson2.JSONObject;
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.embedding.AllMiniLmL6V2QuantizedEmbeddingModel;
import dev.langchain4j.store.embedding.CosineSimilarity;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

/**
 * MatchingEngineService — 四种算法统一匹配引擎
 *
 * 算法说明：
 * 1. COSINE (默认) — All-MiniLM-L6-v2 向量余弦相似度。将文本转换为 384 维向量，
 *    通过计算夹角余弦判断语义接近度。优点：对同义词、近义词有容忍度；
 *    缺点：需要加载本地模型，冷启动慢。
 *
 * 2. JACCARD — 集合交并比。将标签分词后计算交集/并集比率。
 *    优点：轻量、可解释，0成本；缺点：无法处理近义词，对表述方式敏感。
 *
 * 3. BM25 — Okapi BM25 稀疏检索。通过词频(TF)和逆文档频率(IDF)加权计算。
 *    本实现使用基于简历库的简化版本（对照岗位文档打分）。
 *    优点：对关键词精确匹配有倾斜；缺点：需要语料库做 IDF 估计。
 *
 * 4. GALE_SHAPLEY — 双边稳定匹配（实验性）。在一对多投递场景中，
 *    返回 [0~100] 的偏好权重分，作为后续全局稳定匹配的输入分数。
 *    当前实现 = Cosine分 × 活跃度权重 × 槽位供需比。
 */
@Service
public class MatchingEngineService {

    private EmbeddingModel embeddingModel;
    private String activeAlgorithm = "cosine"; // 默认算法

    @PostConstruct
    public void init() {
        this.embeddingModel = new AllMiniLmL6V2QuantizedEmbeddingModel();
    }

    public void setAlgorithm(String algorithm) {
        this.activeAlgorithm = algorithm.toLowerCase();
    }

    public String getAlgorithm() {
        return this.activeAlgorithm;
    }

    /**
     * 统一入口：根据当前算法计算匹配分
     */
    public BigDecimal calculateMatchScore(String jobRequirementsJson, String resumeStructuredJson) {
        return calculateMatchScore(jobRequirementsJson, resumeStructuredJson, this.activeAlgorithm);
    }

    /**
     * 指定算法计算匹配分
     */
    public BigDecimal calculateMatchScore(String jobRequirementsJson, String resumeStructuredJson, String algorithm) {
        try {
            List<String> jobTags = parseToList(jobRequirementsJson);
            List<String> resumeSkills = parseResumeSkills(resumeStructuredJson);

            if (jobTags.isEmpty()) return new BigDecimal("50.00");
            if (resumeSkills.isEmpty()) return new BigDecimal("30.00");

            double score = switch (algorithm.toLowerCase()) {
                case "jaccard" -> jaccardScore(jobTags, resumeSkills);
                case "bm25" -> bm25Score(jobTags, resumeSkills);
                case "gale_shapley" -> galeShapleyPreferenceScore(jobTags, resumeSkills, jobRequirementsJson);
                default -> cosineScore(jobTags, resumeSkills);
            };

            return BigDecimal.valueOf(Math.round(score * 100.0) / 100.0);
        } catch (Exception e) {
            e.printStackTrace();
            return BigDecimal.ZERO;
        }
    }

    /**
     * 计算纯文本之间的相似度 (用于关键词搜索)
     */
    public BigDecimal calculateTextSimilarity(String sourceText, String targetText) {
        return calculateTextSimilarity(sourceText, targetText, this.activeAlgorithm);
    }

    public BigDecimal calculateTextSimilarity(String sourceText, String targetText, String algorithm) {
        if (sourceText == null || sourceText.isBlank()) return new BigDecimal("50.00");
        if (targetText == null || targetText.isBlank()) return BigDecimal.ZERO;

        try {
            // Split keywords by common delimiters
            List<String> sourceTokens = Arrays.asList(sourceText.split("[，,\\s、/]+"));
            List<String> targetTokens = Arrays.asList(targetText.split("[，,\\s、/\\.\\n\\t]+"));

            double score = switch (algorithm.toLowerCase()) {
                case "jaccard" -> jaccardScore(sourceTokens, targetTokens);
                case "bm25" -> bm25Score(sourceTokens, targetTokens);
                case "gale_shapley" -> cosineScoreSafely(sourceTokens, targetTokens); 
                default -> cosineScoreSafely(sourceTokens, targetTokens);
            };

            return BigDecimal.valueOf(Math.round(score * 100.0) / 100.0);
        } catch (Exception e) {
            System.err.println("[MatchingEngine] Text similarity calculation failed: " + e.getMessage());
            return new BigDecimal("50.00"); // Safe neutral score on failure
        }
    }

    private double cosineScoreSafely(List<String> jobTags, List<String> resumeSkills) {
        try {
            return cosineScore(jobTags, resumeSkills);
        } catch (Exception e) {
            System.err.println("[MatchingEngine] Cosine model failed, falling back to Jaccard: " + e.getMessage());
            return jaccardScore(jobTags, resumeSkills);
        }
    }

    // ===== Algorithm 1: Cosine Semantic Similarity =====
    private double cosineScore(List<String> jobTags, List<String> resumeSkills) {
        String jobText = String.join(", ", jobTags);
        String resumeText = String.join(", ", resumeSkills);
        Embedding jobEmb = embeddingModel.embed(jobText).content();
        Embedding resumeEmb = embeddingModel.embed(resumeText).content();
        double similarity = CosineSimilarity.between(jobEmb, resumeEmb);
        // Map [0,1] → [45, 100] to produce realistic display range
        return 45.0 + Math.max(0, similarity) * 55.0;
    }

    // ===== Algorithm 2: Jaccard Set Similarity =====
    private double jaccardScore(List<String> jobTags, List<String> resumeSkills) {
        Set<String> jobSet = normalizeToSet(jobTags);
        Set<String> resumeSet = normalizeToSet(resumeSkills);

        Set<String> intersection = new HashSet<>(jobSet);
        intersection.retainAll(resumeSet);

        Set<String> union = new HashSet<>(jobSet);
        union.addAll(resumeSet);

        if (union.isEmpty()) return 0.0;
        double jaccard = (double) intersection.size() / union.size();
        // Map [0,1] → [20, 100] so pure Jaccard mismatch isn't brutally zero
        return 20.0 + jaccard * 80.0;
    }

    // ===== Algorithm 3: BM25 Simplified =====
    // Uses k1=1.5, b=0.75 standard BM25 parameters
    // Treats jobTags as "query" tokens, resumeSkills as "document"
    private static final double BM25_K1 = 1.5;
    private static final double BM25_B = 0.75;
    private static final double AVG_DOC_LEN = 8.0; // avg expected skill count

    private double bm25Score(List<String> jobTags, List<String> resumeSkills) {
        Set<String> docSet = normalizeToSet(resumeSkills);
        int docLen = resumeSkills.size();
        double score = 0.0;

        for (String queryToken : normalizeToSet(jobTags)) {
            // TF in document
            long tf = resumeSkills.stream()
                    .filter(s -> normalizeToken(s).contains(queryToken))
                    .count();
            if (tf == 0) continue;

            // Simplified IDF: assume query terms are rare (IDF ≈ log(50/1.5))  
            double idf = Math.log((50.0 + 1) / (1.0 + 1));
            double numerator = tf * (BM25_K1 + 1);
            double denominator = tf + BM25_K1 * (1 - BM25_B + BM25_B * docLen / AVG_DOC_LEN);
            score += idf * (numerator / denominator);
        }

        // Normalize to [0, 100]: max possible score ≈ jobTags.size() * idf * k1
        double maxScore = jobTags.size() * Math.log(34.0) * BM25_K1;
        double normalized = maxScore > 0 ? (score / maxScore) * 100.0 : 0.0;
        return Math.min(100.0, Math.max(10.0, normalized));
    }

    // ===== Algorithm 4: Gale-Shapley Preference Weight =====
    // For single application scoring (pre-matching phase):
    // Returns a preference weight = scaled cosine × demand-supply factor
    private double galeShapleyPreferenceScore(List<String> jobTags, List<String> resumeSkills, String jobJson) {
        // Base preference = semantic cosine score
        double baseScore = cosineScore(jobTags, resumeSkills);

        // Slot scarcity factor: fewer slots → higher stakes → we weight score more harshly
        int slots = 10; // default fallback
        try {
            JSONObject jobObj = JSON.parseObject(jobJson);
            if (jobObj != null && jobObj.containsKey("slots")) {
                slots = jobObj.getIntValue("slots", 10);
            }
        } catch (Exception ignored) {}

        // Scarcity multiplier: slot <= 3 → 0.9x (competitive, penalize marginal candidates)
        //                      slot >= 10 → 1.05x (inclusive, slight bonus)
        double scarcityMultiplier = slots <= 3 ? 0.90 : slots <= 6 ? 0.97 : 1.03;
        double gsScore = baseScore * scarcityMultiplier;

        return Math.min(100.0, Math.max(0.0, gsScore));
    }

    // ===== Utilities =====
    private List<String> parseToList(String json) {
        if (json == null || json.isBlank()) return List.of();
        // Unwrap multiple layers of JSON encoding
        String current = json;
        for (int i = 0; i < 4; i++) {
            try {
                Object parsed = JSON.parse(current);
                if (parsed instanceof JSONArray arr) {
                    return arr.toJavaList(String.class)
                              .stream().filter(Objects::nonNull).collect(Collectors.toList());
                } else if (parsed instanceof String s) {
                    current = s;
                } else break;
            } catch (Exception e) { break; }
        }
        return List.of();
    }

    private List<String> parseResumeSkills(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            JSONObject obj = JSON.parseObject(json);
            if (obj == null) return List.of();
            JSONArray skills = obj.getJSONArray("skills");
            if (skills != null && !skills.isEmpty()) {
                return skills.toJavaList(String.class);
            }
            // Fall back to experience text as pseudo-skill tokens
            String experience = obj.getString("experience");
            if (experience != null && !experience.isBlank()) {
                return Arrays.asList(experience.split("[，,\\s、]+"));
            }
        } catch (Exception ignored) {}
        return List.of();
    }

    private Set<String> normalizeToSet(List<String> items) {
        return items.stream()
                    .map(this::normalizeToken)
                    .filter(s -> !s.isBlank())
                    .collect(Collectors.toSet());
    }

    private String normalizeToken(String s) {
        return s.toLowerCase().trim().replaceAll("[^\\w\\u4e00-\\u9fff]", "");
    }
}
