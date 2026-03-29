import re

with open('src/main/java/com/meituan/club/recruitment_api/controller/StudentController.java', 'r') as f:
    content = f.read()

# 1. Add Mapper import and injection
content = content.replace(
    'import com.meituan.club.recruitment_api.mapper.StudentResumeMapper;',
    'import com.meituan.club.recruitment_api.mapper.StudentResumeMapper;\\nimport com.meituan.club.recruitment_api.mapper.StudentProfileMapper;\\nimport com.meituan.club.recruitment_api.entity.StudentProfile;'
)

content = content.replace(
    '    @Autowired\\n    private StudentResumeMapper studentResumeMapper;',
    '    @Autowired\\n    private StudentResumeMapper studentResumeMapper;\\n\\n    @Autowired\\n    private StudentProfileMapper studentProfileMapper;'
)

# 2. Add getProfile method
new_method = """    @GetMapping("/profile/{userId}")
    public Result<java.util.Map<String, Object>> getProfile(@PathVariable Long userId) {
        com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<StudentResume> rQuery = new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<>();
        rQuery.eq("user_id", userId).orderByDesc("id").last("limit 1");
        StudentResume resume = studentResumeMapper.selectOne(rQuery);

        com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<StudentProfile> pQuery = new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<>();
        pQuery.eq("user_id", userId).orderByDesc("id").last("limit 1");
        StudentProfile profile = studentProfileMapper.selectOne(pQuery);

        java.util.Map<String, Object> result = new java.util.HashMap<>();
        if (resume != null) {
            result.put("realName", resume.getRealName());
            result.put("major", resume.getMajor());
            result.put("contact", resume.getContactPhone());
        } else {
            result.put("realName", "同学");
            result.put("major", "未知专业");
        }

        if (profile != null) {
            result.put("college", "校友学院"); // Placeholder if not in entity
            result.put("interests", profile.getInterestTags());
            result.put("personality", profile.getPersonalityType());
        }
        
        return Result.success(result);
    }"""

# Insert before the last closing brace
content = content.rstrip()
if content.endswith('}'):
    content = content[:-1] + "\\n" + new_method + "\\n}"

with open('src/main/java/com/meituan/club/recruitment_api/controller/StudentController.java', 'w') as f:
    f.write(content.replace('\\\\n', '\\n'))
