import re

with open('src/main/java/com/meituan/club/recruitment_api/controller/AiAgentController.java', 'r') as f:
    content = f.read()

old_code = """    @PostMapping("/generate-resume")
    public Result<Map<String, Object>> generateResume(@RequestBody Map<String, String> body) {
        String keywords = body.getOrDefault("keywords", "");
        if (keywords.isBlank()) return Result.error(400, "关键词描述不能为空");

        String prompt = \"\"\"
            请作为专业的职业规划与社团面试专家，根据学生提供的简短经历或关键词，帮TA生成一段适合大学社团申请的、大方得体且有诚意的个人自我介绍，同时提取出对应的结构化技能和兴趣标签。
            
            学生关键词/草稿：
            %s
            
            请严格按照以下 JSON 格式返回，绝对不要输出任何 markdown 格式标记（如 ```json）或额外的客套话：
            {
              "statement": "润色后的一段完整自我介绍文本（可以使用适当的换行）",
              "structuredData": {
                "skills": ["技能标签1", "技能标签2"],
                "interests": ["兴趣标签1", "兴趣标签2"],
                "personality": "简短的性格概括"
              }
            }
            \"\"\".formatted(keywords);"""

new_code = """    @PostMapping("/generate-resume")
    public Result<Map<String, Object>> generateResume(@RequestBody Map<String, Object> body) {
        String keywords = (String) body.getOrDefault("keywords", "");
        if (keywords.isBlank()) return Result.error(400, "关键词描述不能为空");

        Map<String, Object> profile = (Map<String, Object>) body.getOrDefault("userProfile", new HashMap<>());
        String realName = (String) profile.getOrDefault("realName", "同学");
        String major = (String) profile.getOrDefault("major", "未知专业");
        String college = (String) profile.getOrDefault("college", "");
        String interests = (String) profile.getOrDefault("interests", "");

        String prompt = \"\"\"
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
            \"\"\".formatted(realName, college, major, interests, keywords);"""

with open('src/main/java/com/meituan/club/recruitment_api/controller/AiAgentController.java', 'w') as f:
    f.write(content.replace(old_code, new_code))
