package com.meituan.club.recruitment_api.service;

import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.JSONArray;
import com.alibaba.fastjson2.JSONObject;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import jakarta.annotation.PostConstruct;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * UnifiedLLMService — 统一多模型 LLM 网关
 *
 * 支持 6 种 Provider：
 * 1. deepseek — DeepSeek Chat / Reasoner (OpenAI-compatible)
 * 2. openai — GPT-4o / GPT-4o-mini (OpenAI native)
 * 3. gemini — Gemini 2.0 Flash (Google REST API)
 * 4. claude — Claude 3.5 Sonnet (Anthropic Messages API)
 * 5. ollama — 本地 Ollama 模型 (llama3, qwen2.5, deepseek-r1)
 * 6. mock — 离线规则引擎 Fallback (无需网络)
 *
 * 运行时可动态切换 Provider，配置保存在内存中。
 */
@Service
public class UnifiedLLMService {

    private final RestTemplate restTemplate = new RestTemplate();

    // ─── Provider Config ──────────────────────────────────────────────────────
    public static class ProviderConfig {
        public String provider;
        public String apiKey;
        public String endpoint;
        public String model;
        public double temperature;
        public int maxTokens;

        public ProviderConfig(String provider, String apiKey, String endpoint,
                String model, double temperature, int maxTokens) {
            this.provider = provider;
            this.apiKey = apiKey;
            this.endpoint = endpoint;
            this.model = model;
            this.temperature = temperature;
            this.maxTokens = maxTokens;
        }
    }

    // Available provider presets
    private static final Map<String, ProviderConfig> PRESETS = Map.of(
            "deepseek", new ProviderConfig("deepseek", "", "https://api.deepseek.com/v1",
                    "deepseek-chat", 0.7, 1024),
            "openai", new ProviderConfig("openai", "", "https://api.openai.com/v1",
                    "gpt-4o-mini", 0.7, 1024),
            "gemini", new ProviderConfig("gemini", "", "https://generativelanguage.googleapis.com/v1beta",
                    "gemini-3.1-flash-lite-preview", 0.7, 1024),
            "claude", new ProviderConfig("claude", "", "https://api.anthropic.com/v1",
                    "claude-3-5-sonnet-20241022", 0.7, 1024),
            "ollama", new ProviderConfig("ollama", "", "http://localhost:11434",
                    "llama3", 0.7, 1024),
            "mock", new ProviderConfig("mock", "", "", "mock-v1", 0.7, 1024));

    // Runtime mutable config
    private final ConcurrentHashMap<String, ProviderConfig> configs = new ConcurrentHashMap<>();
    private volatile String activeProvider = "mock";

    @PostConstruct
    public void init() {
        // Clone presets as mutable configs
        PRESETS.forEach((k, v) -> configs.put(k, new ProviderConfig(
                v.provider, v.apiKey, v.endpoint, v.model, v.temperature, v.maxTokens)));
    }

    // ─── Public API ───────────────────────────────────────────────────────────

    public String getActiveProvider() {
        return activeProvider;
    }

    public void setActiveProvider(String provider) {
        if (configs.containsKey(provider)) {
            this.activeProvider = provider;
        }
    }

    public Map<String, ProviderConfig> getAllConfigs() {
        return Collections.unmodifiableMap(configs);
    }

    public void updateConfig(String provider, String apiKey, String model,
            String endpoint, Double temperature, Integer maxTokens) {
        ProviderConfig cfg = configs.get(provider);
        if (cfg == null)
            return;
        if (apiKey != null)
            cfg.apiKey = apiKey;
        if (model != null)
            cfg.model = model;
        if (endpoint != null)
            cfg.endpoint = endpoint;
        if (temperature != null)
            cfg.temperature = temperature;
        if (maxTokens != null)
            cfg.maxTokens = maxTokens;
    }

    /**
     * Simple single-turn chat
     */
    public String chat(String systemPrompt, String userMessage) {
        List<Map<String, String>> messages = new ArrayList<>();
        if (systemPrompt != null && !systemPrompt.isBlank()) {
            messages.add(Map.of("role", "system", "content", systemPrompt));
        }
        messages.add(Map.of("role", "user", "content", userMessage));
        return chatWithHistory(messages);
    }

    /**
     * Multi-turn chat with message history
     */
    public String chatWithHistory(List<Map<String, String>> messages) {
        ProviderConfig cfg = configs.get(activeProvider);
        if (cfg == null)
            cfg = configs.get("mock");

        try {
            System.out.println(">>> AI Calling [" + cfg.provider + "] Model: " + cfg.model);
            String response = switch (cfg.provider) {
                case "deepseek", "openai" -> callOpenAICompatible(cfg, messages);
                case "gemini" -> callGemini(cfg, messages);
                case "claude" -> callClaude(cfg, messages);
                case "ollama" -> callOllama(cfg, messages);
                default -> mockResponse(messages);
            };
            System.out.println("<<< AI Response (" + cfg.provider + "): " + (response.length() > 100 ? response.substring(0, 100) + "..." : response));
            return response;
        } catch (Exception e) {
            System.err.println("!!! AI ERROR (" + cfg.provider + "): " + e.getMessage());
            e.printStackTrace();
            return "[AI 调用失败 (" + cfg.provider + "): " + e.getMessage() +
                    "]\n\n已自动回退到 Mock 模式:\n" + mockResponse(messages);
        }
    }

    /**
     * Generate an image using OpenAI DALL-E or equivalent
     */
    public String generateImage(String prompt) {
        ProviderConfig cfg = configs.get("openai");
        if (cfg == null || cfg.apiKey == null || cfg.apiKey.isBlank()) {
            // Fallback to a high-quality Unsplash image for demo if no API key
            String[] placeholders = {
                "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&q=80",
                "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&q=80",
                "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80"
            };
            return placeholders[new Random().nextInt(placeholders.length)];
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(cfg.apiKey);

            Map<String, Object> body = new HashMap<>();
            body.put("model", "dall-e-3");
            body.put("prompt", prompt);
            body.put("n", 1);
            body.put("size", "1024x1024");

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            ResponseEntity<Map> resp = restTemplate.postForEntity(
                cfg.endpoint + "/images/generations", entity, Map.class
            );

            if (resp.getStatusCode().is2xxSuccessful() && resp.getBody() != null) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> data = (List<Map<String, Object>>) resp.getBody().get("data");
                if (data != null && !data.isEmpty()) {
                    return data.get(0).get("url").toString();
                }
            }
        } catch (Exception e) {
            System.err.println("Image generation failed: " + e.getMessage());
        }

        return "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&q=80";
    }

    // ─── Provider Implementations ─────────────────────────────────────────────

    /**
     * OpenAI-compatible API (DeepSeek, OpenAI, etc.)
     */
    private String callOpenAICompatible(ProviderConfig cfg, List<Map<String, String>> messages) {
        if (cfg.apiKey == null || cfg.apiKey.isBlank()) {
            return mockResponse(messages) + "\n\n⚠️ 提示: 未配置 " + cfg.provider + " API Key，使用 Mock 模式";
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(cfg.apiKey);

        Map<String, Object> body = new HashMap<>();
        body.put("model", cfg.model);
        body.put("messages", messages);
        body.put("temperature", cfg.temperature);
        body.put("max_tokens", cfg.maxTokens);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        ResponseEntity<Map> resp = restTemplate.postForEntity(
                cfg.endpoint + "/chat/completions", entity, Map.class);

        return extractOpenAIContent(resp);
    }

    /**
     * Google Gemini API (uses x-goog-api-key header, different body format)
     */
    private String callGemini(ProviderConfig cfg, List<Map<String, String>> messages) {
        if (cfg.apiKey == null || cfg.apiKey.isBlank()) {
            return mockResponse(messages) + "\n\n⚠️ 提示: 未配置 Gemini API Key，使用 Mock 模式";
        }

        // Build Gemini-specific content format
        List<Map<String, Object>> contents = new ArrayList<>();
        String systemInstruction = null;

        for (Map<String, String> msg : messages) {
            String role = msg.get("role");
            String content = msg.get("content");
            if ("system".equals(role)) {
                systemInstruction = content;
                continue;
            }
            String geminiRole = "user".equals(role) ? "user" : "model";
            contents.add(Map.of(
                    "role", geminiRole,
                    "parts", List.of(Map.of("text", content))));
        }

        Map<String, Object> body = new HashMap<>();
        body.put("contents", contents);
        if (systemInstruction != null) {
            body.put("systemInstruction", Map.of(
                    "parts", List.of(Map.of("text", systemInstruction))));
        }
        body.put("generationConfig", Map.of(
                "temperature", cfg.temperature,
                "maxOutputTokens", cfg.maxTokens));

        String url = cfg.endpoint + "/models/" + cfg.model + ":generateContent?key=" + cfg.apiKey;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        ResponseEntity<Map> resp = restTemplate.postForEntity(url, entity, Map.class);

        // Parse Gemini response
        if (resp.getStatusCode().is2xxSuccessful() && resp.getBody() != null) {
            try {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> candidates = (List<Map<String, Object>>) resp.getBody().get("candidates");
                if (candidates != null && !candidates.isEmpty()) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> contentMap = (Map<String, Object>) candidates.get(0).get("content");
                    @SuppressWarnings("unchecked")
                    List<Map<String, String>> parts = (List<Map<String, String>>) contentMap.get("parts");
                    return parts.get(0).get("text");
                }
            } catch (Exception ignored) {
            }
        }
        return "(Gemini 返回格式异常)";
    }

    /**
     * Anthropic Claude API (uses x-api-key header, Messages API)
     */
    private String callClaude(ProviderConfig cfg, List<Map<String, String>> messages) {
        if (cfg.apiKey == null || cfg.apiKey.isBlank()) {
            return mockResponse(messages) + "\n\n⚠️ 提示: 未配置 Claude API Key，使用 Mock 模式";
        }

        // Extract system message
        String system = null;
        List<Map<String, String>> claudeMessages = new ArrayList<>();
        for (Map<String, String> msg : messages) {
            if ("system".equals(msg.get("role"))) {
                system = msg.get("content");
            } else {
                claudeMessages.add(msg);
            }
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-api-key", cfg.apiKey);
        headers.set("anthropic-version", "2023-06-01");

        Map<String, Object> body = new HashMap<>();
        body.put("model", cfg.model);
        body.put("max_tokens", cfg.maxTokens);
        body.put("messages", claudeMessages);
        if (system != null)
            body.put("system", system);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        ResponseEntity<Map> resp = restTemplate.postForEntity(
                cfg.endpoint + "/messages", entity, Map.class);

        if (resp.getStatusCode().is2xxSuccessful() && resp.getBody() != null) {
            try {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> content = (List<Map<String, Object>>) resp.getBody().get("content");
                if (content != null && !content.isEmpty()) {
                    return content.get(0).get("text").toString();
                }
            } catch (Exception ignored) {
            }
        }
        return "(Claude 返回格式异常)";
    }

    /**
     * Ollama local model
     */
    private String callOllama(ProviderConfig cfg, List<Map<String, String>> messages) {
        // Combine messages into a single prompt
        StringBuilder prompt = new StringBuilder();
        for (Map<String, String> msg : messages) {
            String role = msg.get("role");
            String content = msg.get("content");
            if ("system".equals(role)) {
                prompt.append("[System] ").append(content).append("\n\n");
            } else if ("assistant".equals(role)) {
                prompt.append("[Assistant] ").append(content).append("\n\n");
            } else {
                prompt.append("[User] ").append(content).append("\n\n");
            }
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = Map.of(
                "model", cfg.model,
                "prompt", prompt.toString(),
                "stream", false);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        ResponseEntity<Map> resp = restTemplate.postForEntity(
                cfg.endpoint + "/api/generate", entity, Map.class);

        if (resp.getStatusCode().is2xxSuccessful() && resp.getBody() != null) {
            Object r = resp.getBody().get("response");
            return r != null ? r.toString() : "(空响应)";
        }
        return "(Ollama 调用失败)";
    }

    /**
     * Mock fallback — rule-based response without network
     */
    private String mockResponse(List<Map<String, String>> messages) {
        String lastUserMsg = "";
        for (Map<String, String> msg : messages) {
            if ("user".equals(msg.get("role")))
                lastUserMsg = msg.get("content");
        }

        String lower = lastUserMsg.toLowerCase();

        // Detect intent and provide smart mock response
        if (lower.contains("推荐") || lower.contains("社团") || lower.contains("喜欢") ||
                lower.contains("兴趣") || lower.contains("加入") || lower.contains("想")) {
            return "**🤖 AI 助手 (Mock 模式)**\n\n看起来你对寻找和加入社团感兴趣。请在工程面板中配置 API Key 以开启深度 AI 分析与个性化匹配功能。";
        }

        return "**🤖 AI 助手 (Mock 模式)**\n\n" +
                "我收到了你的消息：\n> " + lastUserMsg + "\n\n" +
                "当前正在使用离线 Mock 引擎。请在工程面板中配置 API Key 以启用真实 AI 推荐。\n\n" +
                "💡 **支持的功能**: 社团推荐、兴趣分析、简历解析";
    }

    public String buildMockRecommendation(String userMessage, List<Map<String, Object>> clubs) {
        StringBuilder sb = new StringBuilder();
        sb.append("### 🤖 AI 智能助手 (Mock 模式)\n\n");
        sb.append("由于您目前处于 Mock 模式，我为您筛选了数据库中与“").append(userMessage).append("”最相关的几个社团：\n\n");

        int count = Math.min(3, clubs.size());
        StringBuilder ids = new StringBuilder();

        for (int i = 0; i < count; i++) {
            Map<String, Object> club = clubs.get(i);
            String name = club.get("clubName").toString();
            String desc = club.get("description").toString();
            String id = club.get("id").toString();

            sb.append(String.format("%d. **%s**\n", i + 1, name));
            sb.append("   - **理由**: ").append(desc.length() > 50 ? desc.substring(0, 50) + "..." : desc).append("\n\n");

            ids.append(id).append(i < count - 1 ? "," : "");
        }

        sb.append("---\n");
        sb.append("💡 你可以告诉我更多关于你的兴趣，我会进一步优化推荐。\n");
        sb.append("📎 *提示：配置 API Key 后可获得更智能的深度分析回复。*");

        sb.append("\n<RECOM_IDS>").append(ids).append("</RECOM_IDS>");

        return sb.toString();
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private String extractOpenAIContent(ResponseEntity<Map> resp) {
        if (resp.getStatusCode().is2xxSuccessful() && resp.getBody() != null) {
            try {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> choices = (List<Map<String, Object>>) resp.getBody().get("choices");
                if (choices != null && !choices.isEmpty()) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> msg = (Map<String, Object>) choices.get(0).get("message");
                    return msg.get("content").toString();
                }
            } catch (Exception ignored) {
            }
        }
        return "(LLM 返回格式异常)";
    }
}
