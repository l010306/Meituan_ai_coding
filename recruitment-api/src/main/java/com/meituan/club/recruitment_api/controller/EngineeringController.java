package com.meituan.club.recruitment_api.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.meituan.club.recruitment_api.common.Result;
import com.meituan.club.recruitment_api.entity.*;
import com.meituan.club.recruitment_api.mapper.*;
import com.meituan.club.recruitment_api.service.MatchingEngineService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.*;

/**
 * Engineering Panel Controller
 * Provides endpoints for algorithm config, LLM proxy (cloud & local Ollama), and DB admin.
 */
@CrossOrigin
@RestController
@RequestMapping("/api/v1/engineering")
public class EngineeringController {

    @Autowired
    private MatchingEngineService matchingEngineService;

    @Autowired
    private SysUserMapper sysUserMapper;

    @Autowired
    private StudentResumeMapper studentResumeMapper;

    @Autowired
    private ApplicationFlowMapper applicationFlowMapper;

    @Autowired
    private RecruitmentJobMapper recruitmentJobMapper;

    private final RestTemplate restTemplate = new RestTemplate();

    // ─── Algorithm Config ────────────────────────────────────────────────────

    @GetMapping("/algorithm")
    public Result<Map<String, Object>> getAlgorithmStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("active", matchingEngineService.getAlgorithm());
        status.put("available", List.of(
            Map.of("id", "cosine", "name", "余弦相似度 (Cosine)", "status", "ACTIVE",
                   "description", "All-MiniLM-L6-v2 本地向量模型，384维语义嵌入，支持同义词/近义词匹配",
                   "params", Map.of("model", "all-minilm-l6-v2-quantized", "dims", 384)),
            Map.of("id", "jaccard", "name", "Jaccard 集合相似度", "status", "ACTIVE",
                   "description", "计算标签集合的交/并集比率，轻量零成本，对关键词精确命中最有效",
                   "params", Map.of("normalization", "lowercase+punct-strip")),
            Map.of("id", "bm25", "name", "BM25 稀疏检索", "status", "ACTIVE",
                   "description", "Okapi BM25 (k1=1.5, b=0.75)，对高频关键词精确匹配有倾斜权重",
                   "params", Map.of("k1", 1.5, "b", 0.75, "avgDocLen", 8)),
            Map.of("id", "gale_shapley", "name", "Gale-Shapley 稳定匹配权重", "status", "EXPERIMENTAL",
                   "description", "双边稳定匹配预处理分数。当前实现 = 语义余弦分 × 槽位供需比权重",
                   "params", Map.of("scarcityThreshold", 3, "multiplierRange", "0.90~1.03"))
        ));
        return Result.success(status);
    }

    @PostMapping("/algorithm")
    public Result<String> setAlgorithm(@RequestBody Map<String, String> body) {
        String algo = body.getOrDefault("algorithm", "cosine");
        List<String> valid = List.of("cosine", "jaccard", "bm25", "gale_shapley");
        if (!valid.contains(algo)) return Result.error(400, "Invalid algorithm: " + algo);
        matchingEngineService.setAlgorithm(algo);
        return Result.success("算法已切换为: " + algo);
    }

    @PostMapping("/algorithm/test")
    public Result<Map<String, Object>> testAlgorithm(@RequestBody Map<String, Object> body) {
        String jobTags = body.getOrDefault("jobTags", "[\"文学写作\",\"诗歌创作\",\"团队合作\"]").toString();
        String resumeJson = body.getOrDefault("resumeJson",
            "{\"skills\":[\"写作\",\"文学\"],\"experience\":\"有文学创作经验\"}").toString();
        String algorithm = body.getOrDefault("algorithm", "cosine").toString();

        long start = System.currentTimeMillis();
        var score = matchingEngineService.calculateMatchScore(jobTags, resumeJson, algorithm);
        long elapsed = System.currentTimeMillis() - start;

        Map<String, Object> result = new HashMap<>();
        result.put("algorithm", algorithm);
        result.put("score", score);
        result.put("elapsedMs", elapsed);
        result.put("jobTags", jobTags);
        result.put("resumeJson", resumeJson);
        return Result.success(result);
    }

    // ─── LLM Proxy (Cloud API) ───────────────────────────────────────────────

    @PostMapping("/llm/chat")
    public Result<String> llmChat(@RequestBody Map<String, Object> body) {
        String apiKey = body.getOrDefault("apiKey", "").toString();
        String endpoint = body.getOrDefault("endpoint", "https://api.deepseek.com/v1").toString();
        String model = body.getOrDefault("model", "deepseek-chat").toString();
        String prompt = body.getOrDefault("prompt", "").toString();

        if (apiKey.isBlank() || prompt.isBlank()) {
            return Result.error(400, "apiKey 和 prompt 不能为空");
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            Map<String, Object> requestBody = Map.of(
                "model", model,
                "messages", List.of(Map.of("role", "user", "content", prompt)),
                "temperature", body.getOrDefault("temperature", 0.7),
                "max_tokens", body.getOrDefault("maxTokens", 500)
            );

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(
                endpoint + "/chat/completions", entity, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> choices = (List<Map<String, Object>>) response.getBody().get("choices");
                if (choices != null && !choices.isEmpty()) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                    return Result.success(message.get("content").toString());
                }
            }
            return Result.error(500, "LLM 返回格式异常");
        } catch (Exception e) {
            return Result.error(500, "调用失败: " + e.getMessage());
        }
    }

    // ─── Ollama Local LLM Proxy ──────────────────────────────────────────────

    @PostMapping("/llm/ollama")
    public Result<String> ollamaChat(@RequestBody Map<String, Object> body) {
        String ollamaUrl = body.getOrDefault("ollamaUrl", "http://localhost:11434").toString();
        String model = body.getOrDefault("model", "llama3").toString();
        String prompt = body.getOrDefault("prompt", "").toString();

        if (prompt.isBlank()) return Result.error(400, "prompt 不能为空");

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> requestBody = Map.of(
                "model", model,
                "prompt", prompt,
                "stream", false
            );

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(
                ollamaUrl + "/api/generate", entity, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Object respText = response.getBody().get("response");
                return Result.success(respText != null ? respText.toString() : "(空响应)");
            }
            return Result.error(500, "Ollama 返回格式异常");
        } catch (Exception e) {
            return Result.error(500, "Ollama 调用失败: " + e.getMessage() +
                " (请确认 Ollama 已启动: ollama serve)");
        }
    }

    @GetMapping("/llm/ollama/models")
    public Result<Object> ollamaListModels(@RequestParam(defaultValue = "http://localhost:11434") String ollamaUrl) {
        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(ollamaUrl + "/api/tags", Map.class);
            if (response.getStatusCode().is2xxSuccessful()) {
                return Result.success(response.getBody());
            }
            return Result.error(500, "无法获取模型列表");
        } catch (Exception e) {
            return Result.error(503, "Ollama 未运行: " + e.getMessage());
        }
    }

    // ─── DB Admin CRUD ───────────────────────────────────────────────────────

    @GetMapping("/db/tables")
    public Result<List<String>> listTables() {
        return Result.success(List.of("sys_user", "recruitment_job", "student_resume",
                "application_flow", "student_profile"));
    }

    @GetMapping("/db/sys_user")
    public Result<Object> getUsersAdmin(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        var qw = new QueryWrapper<SysUser>();
        qw.last("LIMIT " + size + " OFFSET " + (page - 1) * size);
        var list = sysUserMapper.selectList(qw);
        long total = sysUserMapper.selectCount(new QueryWrapper<>());
        return Result.success(Map.of("list", list, "total", total, "page", page, "size", size));
    }

    @GetMapping("/db/recruitment_job")
    public Result<Object> getJobsAdmin(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        var qw = new QueryWrapper<com.meituan.club.recruitment_api.entity.RecruitmentJob>();
        qw.last("LIMIT " + size + " OFFSET " + (page - 1) * size);
        var list = recruitmentJobMapper.selectList(qw);
        long total = recruitmentJobMapper.selectCount(new QueryWrapper<>());
        return Result.success(Map.of("list", list, "total", total, "page", page, "size", size));
    }

    @GetMapping("/db/student_resume")
    public Result<Object> getResumesAdmin(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        var qw = new QueryWrapper<com.meituan.club.recruitment_api.entity.StudentResume>();
        qw.last("LIMIT " + size + " OFFSET " + (page - 1) * size);
        var list = studentResumeMapper.selectList(qw);
        long total = studentResumeMapper.selectCount(new QueryWrapper<>());
        return Result.success(Map.of("list", list, "total", total, "page", page, "size", size));
    }

    @GetMapping("/db/application_flow")
    public Result<Object> getApplicationsAdmin(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        var qw = new QueryWrapper<com.meituan.club.recruitment_api.entity.ApplicationFlow>();
        qw.last("LIMIT " + size + " OFFSET " + (page - 1) * size);
        var list = applicationFlowMapper.selectList(qw);
        long total = applicationFlowMapper.selectCount(new QueryWrapper<>());
        return Result.success(Map.of("list", list, "total", total, "page", page, "size", size));
    }

    @GetMapping("/db/application_flow/reset")
    public Result<String> resetApplications() {
        applicationFlowMapper.delete(new QueryWrapper<ApplicationFlow>().ge("id", 0));
        return Result.success("所有投递记录已清空");
    }

    @DeleteMapping("/db/application_flow/{id}")
    public Result<String> deleteApplication(@PathVariable Long id) {
        int rows = applicationFlowMapper.deleteById(id);
        return rows > 0 ? Result.success("删除成功") : Result.error(404, "记录不存在");
    }

    @DeleteMapping("/db/student_resume/{id}")
    public Result<String> deleteResume(@PathVariable Long id) {
        int rows = studentResumeMapper.deleteById(id);
        return rows > 0 ? Result.success("删除成功") : Result.error(404, "记录不存在");
    }

    @PutMapping("/db/recruitment_job/{id}/status")
    public Result<String> updateJobStatus(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        var job = recruitmentJobMapper.selectById(id);
        if (job == null) return Result.error(404, "岗位不存在");
        job.setStatus(Integer.valueOf(body.get("status").toString()));
        recruitmentJobMapper.updateById(job);
        return Result.success("状态已更新");
    }
}
