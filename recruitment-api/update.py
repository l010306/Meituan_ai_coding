import re

with open('src/main/java/com/meituan/club/recruitment_api/controller/StudentController.java', 'r') as f:
    content = f.read()

old_content = """    @PostMapping("/resume/submit-form")
    public Result<StudentResume> submitFormResume(
            @RequestParam(value = "userId", required = false) Long userId,
            @RequestParam(value = "realName") String realName,
            @RequestParam(value = "contact") String contact,
            @RequestParam(value = "major") String major,
            @RequestParam(value = "personalStatement") String personalStatement) {

        if (userId == null) userId = 999L;
        StudentResume resume = new StudentResume();
        resume.setUserId(userId);
        resume.setRealName(realName);
        resume.setContactPhone(contact);
        resume.setMajor(major);
        resume.setPersonalStatement(personalStatement);
        // No PDF data
        resume.setRawText("Form Only Application");
        // We can treat personalStatement as the minimal structured data for AI comparison
        resume.setStructuredData("{\\"experience\\": \\"" + personalStatement + "\\", \\"skills\\": []}");
        resume.setCreateTime(LocalDateTime.now());
        resume.setUpdateTime(LocalDateTime.now());

        studentResumeMapper.insert(resume);
        return Result.success(resume);
    }"""

new_content = """    @PostMapping("/resume/submit-form")
    public Result<StudentResume> submitFormResume(
            @RequestParam(value = "userId", required = false) Long userId,
            @RequestParam(value = "realName") String realName,
            @RequestParam(value = "contact") String contact,
            @RequestParam(value = "major") String major,
            @RequestParam(value = "personalStatement") String personalStatement,
            @RequestParam(value = "structuredData", required = false) String structuredData) {

        if (userId == null) userId = 999L;
        StudentResume resume = new StudentResume();
        resume.setUserId(userId);
        resume.setRealName(realName);
        resume.setContactPhone(contact);
        resume.setMajor(major);
        resume.setPersonalStatement(personalStatement);
        // No PDF data
        resume.setRawText("Form Only Application");
        // Use provided structuredData from AI generator, or fallback to simple JSON
        if (structuredData != null && !structuredData.isBlank()) {
            resume.setStructuredData(structuredData);
        } else {
            resume.setStructuredData("{\\"experience\\": \\"" + personalStatement + "\\", \\"skills\\": []}");
        }
        resume.setCreateTime(LocalDateTime.now());
        resume.setUpdateTime(LocalDateTime.now());

        studentResumeMapper.insert(resume);
        return Result.success(resume);
    }"""

with open('src/main/java/com/meituan/club/recruitment_api/controller/StudentController.java', 'w') as f:
    f.write(content.replace(old_content, new_content))
