package com.meituan.club.recruitment_api.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.meituan.club.recruitment_api.common.Result;
import com.meituan.club.recruitment_api.entity.RecruitmentJob;
import com.meituan.club.recruitment_api.mapper.RecruitmentJobMapper;
import com.meituan.club.recruitment_api.service.MatchingEngineService;
import com.meituan.club.recruitment_api.service.UnifiedLLMService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

/**
 * AI Agent Controller — 对话式智能社团推荐 Agent
 *
 * 提供 RAG 风格的推荐：
 * 1. 接收学生自然语言描述
 * 2. 从社团数据库检索候选社团（带语义匹配分）
 * 3. 将候选社团数据注入 LLM Prompt 做增强生成
 * 4. 返回结构化推荐结果 + AI 叙事理由
 */
@CrossOrigin
@RestController
@RequestMapping("/api/v1/ai")
public class AiAgentController {

    @Autowired
    private UnifiedLLMService llmService;

    @Autowired
    private MatchingEngineService matchingEngineService;

    @Autowired
    private RecruitmentJobMapper recruitmentJobMapper;

    private static final String SYSTEM_PROMPT = """
        你是"社团推荐AI助手"，专门帮助大学新生找到最适合的社团。
        
        你的职责：
        1. 理解学生的兴趣、性格、时间安排等信息
        2. 根据提供的社团数据，推荐最匹配的社团
        3. 为每个推荐给出具体理由（引用社团的活动、特色等）
        4. 如果信息不足，主动追问以优化推荐
        
        回复规则：
        - 用中文回复
        - 推荐 3-5 个社团
        - 每个推荐包含：社团名、匹配度、推荐理由
        - 正文中只需写社团名，不要显示 ID。ID 仅能且必须出现在最后的标记中
        - 在回复的最末尾（强制独占一行），你必须严格按照格式返回你所推荐的所有社团的对应 ID，不能有任何多余字符，例如：
          <RECOM_IDS>12,45,8</RECOM_IDS>
        - 语气友好、专业
        - 回复中用 Markdown 格式方便前端渲染
        """;

    // ─── 1. 对话式推荐 (核心接口) ──────────────────────────────────────────

    @PostMapping("/chat")
    public Result<Map<String, Object>> chat(@RequestBody Map<String, Object> body) {
        String userMessage = body.getOrDefault("message", "").toString();
        String category = body.getOrDefault("category", "").toString();

        @SuppressWarnings("unchecked")
        List<Map<String, String>> history = (List<Map<String, String>>)
            body.getOrDefault("history", new ArrayList<>());

        if (userMessage.isBlank()) return Result.error(400, "消息不能为空");

        // Step 1: Retrieve candidate clubs from DB using semantic matching
        List<Map<String, Object>> rankedClubs = retrieveClubs(userMessage, category, 8);

        // Step 2: Build RAG context — inject club data into prompt
        String ragContext = buildRAGContext(rankedClubs);

        // Step 3: Assemble full message history for LLM
        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", SYSTEM_PROMPT + "\n\n" + ragContext));

        // Add conversation history
        for (Map<String, String> msg : history) {
            messages.add(Map.of("role", msg.getOrDefault("role", "user"),
                               "content", msg.getOrDefault("content", "")));
        }
        messages.add(Map.of("role", "user", "content", userMessage));

        // Step 4: Call LLM
        long start = System.currentTimeMillis();
        String aiResponse = llmService.chatWithHistory(messages);
        long elapsed = System.currentTimeMillis() - start;

        // Step 5: Post-process — Parse <RECOM_IDS> to sync UI cards
        List<Map<String, Object>> finalMatchedClubs = new ArrayList<>();
        String cleanResponse = aiResponse;
        
        try {
            int tagStart = aiResponse.indexOf("<RECOM_IDS>");
            int tagEnd = aiResponse.indexOf("</RECOM_IDS>");
            if (tagStart >= 0 && tagEnd > tagStart) {
                String idsStr = aiResponse.substring(tagStart + 11, tagEnd).trim();
                cleanResponse = (aiResponse.substring(0, tagStart) + aiResponse.substring(tagEnd + 12)).trim();
                
                Set<String> recommendedIds = Arrays.stream(idsStr.split(","))
                    .map(String::trim)
                    .collect(Collectors.toSet());
                
                finalMatchedClubs = rankedClubs.stream()
                    .filter(c -> recommendedIds.contains(c.get("id").toString()))
                    .collect(Collectors.toList());
            }
        } catch (Exception e) {
            // Fallback: if parsing fails, show top 3
            finalMatchedClubs = rankedClubs.stream().limit(3).collect(Collectors.toList());
        }

        // If no tags found or filter empty, use top 3
        if (finalMatchedClubs.isEmpty()) {
            finalMatchedClubs = rankedClubs.stream().limit(3).collect(Collectors.toList());
        }

        // Step 6: Return structured result
        Map<String, Object> result = new HashMap<>();
        result.put("response", cleanResponse);
        result.put("provider", llmService.getActiveProvider());
        result.put("elapsedMs", elapsed);
        result.put("matchedClubs", finalMatchedClubs);

        return Result.success(result);
    }

    // ─── 2. 画像解析 ──────────────────────────────────────────────────────────

    @PostMapping("/analyze-profile")
    public Result<Map<String, Object>> analyzeProfile(@RequestBody Map<String, String> body) {
        String description = body.getOrDefault("description", "");
        if (description.isBlank()) return Result.error(400, "描述不能为空");

        String prompt = """
            分析以下大学生的自我描述，提取结构化画像。
            请严格按照以下 JSON 格式返回，不要添加任何其他文字：
            {
              "interests": ["兴趣1", "兴趣2"],
              "skills": ["技能1", "技能2"],
              "personality": "性格类型描述",
              "weeklyHours": 预估每周可投入小时数(数字),
              "preferredCategories": ["体育", "技术"],
              "keywords": ["关键词1", "关键词2", "关键词3"]
            }
            
            学生描述：""" + description;

        String result = llmService.chat(null, prompt);

        Map<String, Object> response = new HashMap<>();
        response.put("rawAnalysis", result);
        response.put("provider", llmService.getActiveProvider());

        // Try to parse JSON from the response
        try {
            // Find JSON in response
            int start = result.indexOf("{");
            int end = result.lastIndexOf("}");
            if (start >= 0 && end > start) {
                String json = result.substring(start, end + 1);
                response.put("structured", com.alibaba.fastjson2.JSON.parseObject(json));
            }
        } catch (Exception ignored) {}

        return Result.success(response);
    }

    // ─── 3. 简历生成与智能审核 (Phase 14) ──────────────────────────────────────────────────────────

    @PostMapping("/generate-resume")
    public Result<Map<String, Object>> generateResume(@RequestBody Map<String, Object> body) {
        String keywords = (String) body.getOrDefault("keywords", "");
        if (keywords.isBlank()) return Result.error(400, "关键词描述不能为空");

        Map<String, Object> profile = (Map<String, Object>) body.getOrDefault("userProfile", new HashMap<>());
        String realName = (String) profile.getOrDefault("realName", "同学");
        String major = (String) profile.getOrDefault("major", "未知专业");
        String college = (String) profile.getOrDefault("college", "");
        String interests = (String) profile.getOrDefault("interests", "");

        String prompt = """
            请作为专业的职业规划与社团面试专家，根据学生提供的简短经历或关键词，帮TA生成一段适合大学社团申请的、大方得体且有诚意的个人自我介绍。
            
            注意：请务必结合以下学生的背景信息进行【针对性创作】，直接在正文中使用姓名和背景，【严禁】使用“[姓名]”、“[专业]”等占位符：
            - 姓名：%s
            - 专业背景：%s %s
            - 已有兴趣/特长：%s
            
            学生提供的关键词/草稿：
            %s
            
            请严格按照以下 JSON 格式返回，绝对不要输出任何 markdown 格式标记（如 ```json）或额外的客套话：
            {
              "statement": "润色后的一段完整自我介绍文本（包含姓名且无占位符，可以使用适当的换行）",
              "structuredData": {
                "skills": ["技能标签1", "技能标签2"],
                "interests": ["兴趣标签1", "兴趣标签2"],
                "personality": "简短的性格概括"
              }
            }
            """.formatted(realName, college, major, interests, keywords);

        String result = llmService.chat(null, prompt);

        Map<String, Object> response = new HashMap<>();
        response.put("rawResult", result);
        try {
            int start = result.indexOf("{");
            int end = result.lastIndexOf("}");
            if (start >= 0 && end > start) {
                String json = result.substring(start, end + 1);
                response.put("data", com.alibaba.fastjson2.JSON.parseObject(json));
            }
        } catch (Exception ignored) {}

        return Result.success(response);
    }

    @PostMapping("/generate-recruitment-ad")
    public Result<String> generateRecruitmentAd(@RequestBody Map<String, Object> body) {
        String clubName = (String) body.getOrDefault("clubName", "本社团");
        String keywords = (String) body.getOrDefault("keywords", "");
        
        String prompt = "请作为专业的文案策划，为名为 '" + clubName + "' 的大学社团创作一段极具号召力的招新宣传文案。关键词：" + keywords + 
                       "。请用中文。回复中只需包含宣传正文，不要有任何客套话，风格要青春活泼。";
        
        String result = llmService.chat(null, prompt);
        return Result.success(result);
    }

    @PostMapping("/review-application")
    public Result<Map<String, Object>> reviewApplication(@RequestBody Map<String, Object> body) {
        String jobTitle = (String) body.getOrDefault("jobTitle", "未知岗位");
        String jobDesc = (String) body.getOrDefault("jobDesc", "");
        String studentStatement = (String) body.getOrDefault("studentStatement", "");
        Object studentTagsObj = body.getOrDefault("studentTags", "[]");
        String studentTags = studentTagsObj != null ? studentTagsObj.toString() : "[]";

        String prompt = """
            作为资深的大学社团面试官，请分析这名学生的申请资料与社团职位的供需匹配度，并在客观中立的基础上给出一份智能评估。
            
            【社团及岗位】: %s
            【岗位要求/简介】: %s
            
            【学生自我介绍】: %s
            【学生结构化标签】: %s
            
            请严格按照以下 JSON 格式返回，绝对不要输出任何 markdown 格式标记（如 ```json）或额外的说明文本：
            {
              "strengths": ["匹配亮点1", "匹配亮点2 (简短说明为什么匹配)"],
              "weaknesses": ["潜在不足之处", "需在面试中进一步了解的问题"],
              "recommendation": "客观的一句话综合建议（例如：匹配度极高，强烈建议邀约面试；或经历明显不符，建议不予通过等）"
            }
            """.formatted(jobTitle, jobDesc, studentStatement, studentTags);

        String result = llmService.chat(null, prompt);

        Map<String, Object> response = new HashMap<>();
        response.put("rawResult", result);
        try {
            int start = result.indexOf("{");
            int end = result.lastIndexOf("}");
            if (start >= 0 && end > start) {
                String json = result.substring(start, end + 1);
                response.put("data", com.alibaba.fastjson2.JSON.parseObject(json));
            }
        } catch (Exception ignored) {}

        return Result.success(response);
    }

    // ─── 4. 配置管理 ──────────────────────────────────────────────────────────

    @GetMapping("/config")
    public Result<Map<String, Object>> getConfig() {
        Map<String, Object> config = new HashMap<>();
        config.put("activeProvider", llmService.getActiveProvider());

        Map<String, Map<String, Object>> providers = new HashMap<>();
        llmService.getAllConfigs().forEach((key, cfg) -> {
            Map<String, Object> info = new HashMap<>();
            info.put("provider", cfg.provider);
            info.put("model", cfg.model);
            info.put("endpoint", cfg.endpoint);
            info.put("temperature", cfg.temperature);
            info.put("maxTokens", cfg.maxTokens);
            info.put("hasApiKey", cfg.apiKey != null && !cfg.apiKey.isBlank());
            providers.put(key, info);
        });
        config.put("providers", providers);

        return Result.success(config);
    }

    @PutMapping("/config")
    public Result<String> updateConfig(@RequestBody Map<String, Object> body) {
        String provider = body.getOrDefault("provider", "").toString();
        if (provider.isBlank()) return Result.error(400, "provider 不能为空");

        String apiKey = body.containsKey("apiKey") ? body.get("apiKey").toString() : null;
        String model = body.containsKey("model") ? body.get("model").toString() : null;
        String endpoint = body.containsKey("endpoint") ? body.get("endpoint").toString() : null;
        Double temperature = body.containsKey("temperature")
            ? Double.valueOf(body.get("temperature").toString()) : null;
        Integer maxTokens = body.containsKey("maxTokens")
            ? Integer.valueOf(body.get("maxTokens").toString()) : null;

        llmService.updateConfig(provider, apiKey, model, endpoint, temperature, maxTokens);

        if (body.containsKey("setActive") && Boolean.parseBoolean(body.get("setActive").toString())) {
            llmService.setActiveProvider(provider);
        }

        return Result.success("配置已更新: " + provider);
    }

    @PostMapping("/config/switch")
    public Result<String> switchProvider(@RequestBody Map<String, String> body) {
        String provider = body.getOrDefault("provider", "mock");
        llmService.setActiveProvider(provider);
        return Result.success("已切换至: " + provider + " (" + llmService.getActiveProvider() + ")");
    }

    @PostMapping("/generate-poster")
    public Result<Map<String, String>> generatePoster(@RequestBody Map<String, String> body) {
        String clubName = body.getOrDefault("clubName", "社团");
        String style = body.getOrDefault("style", "校园风格");
        String description = body.getOrDefault("description", "");

        // Step 1: Use LLM to optimize the prompt for image generation
        String promptRefiner = """
            作为资深的设计提示词专家，请根据以下社团信息，为 DALL-E 3 生成一段详细的英文 Prompt。
            海报主题：校园社团招新
            社团名称：%s
            风格要求：%s
            社团简介：%s
            
            Prompt 要求：描述画面构图、色彩分布、光影效果，确保画面具有青春活力、吸引力，充满校园氛围。直接返回 Prompt 文本，不要有任何客套。
            """.formatted(clubName, style, description);
        
        String optimizedPrompt = llmService.chat(null, promptRefiner);
        
        // Step 2: Generate the image
        String imageUrl = llmService.generateImage(optimizedPrompt);
        
        return Result.success(Map.of("url", imageUrl, "prompt", optimizedPrompt));
    }

    // ─── Internal RAG Retrieval ───────────────────────────────────────────────

    private List<Map<String, Object>> retrieveClubs(String userQuery, String category, int topK) {
        QueryWrapper<RecruitmentJob> qw = new QueryWrapper<>();
        qw.eq("status", 1);
        if (category != null && !category.isEmpty() && !"全部".equals(category)) {
            qw.eq("category", category);
        }

        List<RecruitmentJob> candidates = recruitmentJobMapper.selectList(qw);
        List<Map<String, Object>> scored = new ArrayList<>();

        for (RecruitmentJob job : candidates) {
            String targetText = (job.getTitle() != null ? job.getTitle() : "") + " " +
                               (job.getDescription() != null ? job.getDescription() : "");
            BigDecimal score = matchingEngineService.calculateTextSimilarity(userQuery, targetText);

            Map<String, Object> entry = new HashMap<>();
            entry.put("id", job.getId());
            entry.put("clubName", job.getClubName());
            entry.put("category", job.getCategory());
            entry.put("title", job.getTitle());
            entry.put("description", truncate(job.getDescription(), 200));
            entry.put("matchScore", score);
            scored.add(entry);
        }

        scored.sort((a, b) -> ((BigDecimal) b.get("matchScore")).compareTo((BigDecimal) a.get("matchScore")));
        return scored.stream().limit(topK).collect(Collectors.toList());
    }

    private String buildRAGContext(List<Map<String, Object>> clubs) {
        if (clubs.isEmpty()) return "【社团数据库】当前无可推荐社团。";

        StringBuilder sb = new StringBuilder("【社团数据库检索结果 — 以下是与学生兴趣最相近的社团详细信息（含ID）】\n\n");
        for (int i = 0; i < clubs.size(); i++) {
            Map<String, Object> c = clubs.get(i);
            sb.append(String.format("- [ID: %s] **%s** [%s] — 匹配度 %s%%\n   简介: %s\n\n",
                c.get("id"), c.get("clubName"), c.get("category"),
                c.get("matchScore"), c.get("description")));
        }
        sb.append("请根据以上数据，结合学生的具体描述，做出个性化推荐。优先推荐匹配度高的，但也可以根据学生的表述推荐匹配度稍低但可能更合适的社团。\n");
        return sb.toString();
    }

    private String truncate(String s, int maxLen) {
        if (s == null) return "";
        return s.length() > maxLen ? s.substring(0, maxLen) + "..." : s;
    }
}
