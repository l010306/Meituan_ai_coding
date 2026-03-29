import re

with open('src/main/java/com/meituan/club/recruitment_api/controller/StudentController.java', 'r') as f:
    code = f.read()

# 1. Update parseResume signature and body
old_parse = """    @PostMapping("/resume/parse")
    public Result<StudentResume> parseResume(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "userId", required = false) Long userId,
            @RequestParam(value = "realName", required = false) String realName,
            @RequestParam(value = "contact", required = false) String contact,
            @RequestParam(value = "major", required = false) String major,
            @RequestParam(value = "personalStatement", required = false) String personalStatement) {"""

new_parse = """    @PostMapping("/resume/parse")
    public Result<StudentResume> parseResume(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "userId", required = false) Long userId,
            @RequestParam(value = "realName", required = false) String realName,
            @RequestParam(value = "contact", required = false) String contact,
            @RequestParam(value = "major", required = false) String major,
            @RequestParam(value = "personalStatement", required = false) String personalStatement,
            @RequestParam(value = "portfolioUrl", required = false) String portfolioUrl) {"""

code = code.replace(old_parse, new_parse)
code = code.replace("resume.setPersonalStatement(personalStatement);", "resume.setPersonalStatement(personalStatement);\\n        resume.setPortfolioUrl(portfolioUrl);")

# 2. Update submitFormResume signature and body
old_submit = """    @PostMapping("/resume/submit-form")
    public Result<StudentResume> submitFormResume(
            @RequestParam(value = "userId", required = false) Long userId,
            @RequestParam(value = "realName") String realName,
            @RequestParam(value = "contact") String contact,
            @RequestParam(value = "major") String major,
            @RequestParam(value = "personalStatement") String personalStatement,
            @RequestParam(value = "structuredData", required = false) String structuredData) {"""

new_submit = """    @PostMapping("/resume/submit-form")
    public Result<StudentResume> submitFormResume(
            @RequestParam(value = "userId", required = false) Long userId,
            @RequestParam(value = "realName") String realName,
            @RequestParam(value = "contact") String contact,
            @RequestParam(value = "major") String major,
            @RequestParam(value = "personalStatement") String personalStatement,
            @RequestParam(value = "structuredData", required = false) String structuredData,
            @RequestParam(value = "portfolioUrl", required = false) String portfolioUrl) {"""

code = code.replace(old_submit, new_submit)
# Already handles adding portfolioUrl to resume entity if I use the same setPortfolioUrl logic
code = code.replace("resume.setPersonalStatement(personalStatement);", "resume.setPersonalStatement(personalStatement);\\n        resume.setPortfolioUrl(portfolioUrl);")

with open('src/main/java/com/meituan/club/recruitment_api/controller/StudentController.java', 'w') as f:
    f.write(code.replace('\\\\n', '\\n'))
