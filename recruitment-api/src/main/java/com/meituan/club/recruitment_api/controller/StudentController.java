package com.meituan.club.recruitment_api.controller;

import com.meituan.club.recruitment_api.common.Result;
import com.meituan.club.recruitment_api.entity.ApplicationFlow;
import com.meituan.club.recruitment_api.entity.RecruitmentJob;
import com.meituan.club.recruitment_api.entity.StudentResume;
import com.meituan.club.recruitment_api.entity.StudentProfile;
import com.meituan.club.recruitment_api.mapper.ApplicationFlowMapper;
import com.meituan.club.recruitment_api.mapper.RecruitmentJobMapper;
import com.meituan.club.recruitment_api.mapper.StudentResumeMapper;
import com.meituan.club.recruitment_api.mapper.StudentProfileMapper;
import com.meituan.club.recruitment_api.service.MatchingEngineService;
import com.meituan.club.recruitment_api.service.ResumeParserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@CrossOrigin
@RestController
@RequestMapping("/api/v1/recruitment")
public class StudentController {

    @Autowired
    private ResumeParserService resumeParserService;

    @Autowired
    private MatchingEngineService matchingEngineService;

    @Autowired
    private StudentResumeMapper studentResumeMapper;

    @Autowired
    private RecruitmentJobMapper recruitmentJobMapper;

    @Autowired
    private ApplicationFlowMapper applicationFlowMapper;

    @Autowired
    private StudentProfileMapper studentProfileMapper;

    @PostMapping("/resume/parse")
    public Result<StudentResume> parseResume(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "userId", required = false) Long userId,
            @RequestParam(value = "realName", required = false) String realName,
            @RequestParam(value = "contact", required = false) String contact,
            @RequestParam(value = "major", required = false) String major,
            @RequestParam(value = "personalStatement", required = false) String personalStatement,
            @RequestParam(value = "portfolioUrl", required = false) String portfolioUrl) {

        if (userId == null) userId = 999L;
        String rawText = resumeParserService.parsePdfToText(file);
        String structuredJson = resumeParserService.buildStructuredData(rawText);

        StudentResume resume = new StudentResume();
        resume.setUserId(userId);
        resume.setRealName(realName);
        resume.setContactPhone(contact);
        resume.setMajor(major);
        resume.setPersonalStatement(personalStatement);
        resume.setPortfolioUrl(portfolioUrl);
        resume.setRawText(rawText);
        resume.setStructuredData(structuredJson);
        resume.setCreateTime(LocalDateTime.now());
        resume.setUpdateTime(LocalDateTime.now());

        studentResumeMapper.insert(resume);
        return Result.success(resume);
    }

    @PostMapping("/resume/submit-form")
    public Result<StudentResume> submitFormResume(
            @RequestParam(value = "userId", required = false) Long userId,
            @RequestParam(value = "realName") String realName,
            @RequestParam(value = "contact") String contact,
            @RequestParam(value = "major") String major,
            @RequestParam(value = "personalStatement") String personalStatement,
            @RequestParam(value = "structuredData", required = false) String structuredData,
            @RequestParam(value = "portfolioUrl", required = false) String portfolioUrl) {

        if (userId == null) userId = 999L;
        StudentResume resume = new StudentResume();
        resume.setUserId(userId);
        resume.setRealName(realName);
        resume.setContactPhone(contact);
        resume.setMajor(major);
        resume.setPersonalStatement(personalStatement);
        resume.setPortfolioUrl(portfolioUrl);
        resume.setRawText("Form Only Application");
        
        if (structuredData != null && !structuredData.isBlank()) {
            resume.setStructuredData(structuredData);
        } else {
            resume.setStructuredData("{\"experience\": \"" + personalStatement + "\", \"skills\": []}");
        }
        resume.setCreateTime(LocalDateTime.now());
        resume.setUpdateTime(LocalDateTime.now());

        studentResumeMapper.insert(resume);
        return Result.success(resume);
    }

    @GetMapping("/jobs/all")
    public Result<List<RecruitmentJob>> getAllJobs() {
        return Result.success(recruitmentJobMapper.selectList(
            new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<RecruitmentJob>().eq("status", 1)
        ));
    }

    @GetMapping("/jobs/search")
    public Result<List<RecruitmentJob>> searchJobs(
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "keyword", required = false) String keyword) {
        com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<RecruitmentJob> qw = new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<>();
        qw.eq("status", 1);
        if (category != null && !category.isEmpty() && !"全部".equals(category)) {
            qw.eq("category", category);
        }
        if (keyword != null && !keyword.isEmpty()) {
            qw.and(wrapper -> wrapper
                .like("club_name", keyword)
                .or().like("title", keyword)
                .or().like("description", keyword)
                .or().like("guidance_unit", keyword)
                .or().like("main_activities", keyword)
                .or().like("representative_activities", keyword)
            );
        }
        return Result.success(recruitmentJobMapper.selectList(qw));
    }

    @GetMapping("/match")
    public Result<List<Map<String, Object>>> matchJobs(
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "keyword") String keyword) {
        
        com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<RecruitmentJob> qw = new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<>();
        qw.eq("status", 1);
        if (category != null && !category.isEmpty() && !"全部".equals(category)) {
            qw.eq("category", category);
        }

        List<RecruitmentJob> candidates = recruitmentJobMapper.selectList(qw);
        List<Map<String, Object>> scored = new ArrayList<>();

        for (RecruitmentJob job : candidates) {
            String targetText = job.getTitle() + " " + job.getDescription();
            BigDecimal score = matchingEngineService.calculateTextSimilarity(keyword, targetText);
            
            Map<String, Object> map = new HashMap<>();
            map.put("id", job.getId());
            map.put("clubName", job.getClubName());
            map.put("category", job.getCategory());
            map.put("title", job.getTitle());
            map.put("description", job.getDescription());
            map.put("requirementTags", job.getRequirementTags());
            map.put("establishedYear", job.getEstablishedYear());
            map.put("guidanceUnit", job.getGuidanceUnit());
            map.put("matchScore", score);
            scored.add(map);
        }

        scored.sort((a, b) -> ((BigDecimal) b.get("matchScore")).compareTo((BigDecimal) a.get("matchScore")));
        return Result.success(scored);
    }

    @GetMapping("/job/{id}")
    public Result<RecruitmentJob> getJobById(@PathVariable(value = "id") Long id) {
        return Result.success(recruitmentJobMapper.selectById(id));
    }

    @GetMapping("/my-applications")
    public Result<List<Map<String, Object>>> getMyApplications(@RequestParam(value = "userId") String userIdStr) {
        Long userId;
        try {
            userId = Long.parseLong(userIdStr);
        } catch (Exception e) {
            userId = 1001L; // Fallback to demo user
        }

        // 1. Find all resumes for this user
        List<StudentResume> resumes = studentResumeMapper.selectList(
            new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<StudentResume>().eq("user_id", userId)
        );
        
        if (resumes.isEmpty()) {
            return Result.success(new ArrayList<>());
        }

        // Map of studentId -> Resume for quick access
        Map<Long, StudentResume> studentMap = resumes.stream().collect(Collectors.toMap(StudentResume::getId, r -> r));
        List<Long> resumeIds = new ArrayList<>(studentMap.keySet());

        // 2. Find all flows for these resumeIds
        com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<ApplicationFlow> qw = new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<>();
        qw.in("student_id", resumeIds);
        qw.orderByDesc("create_time");
        
        List<ApplicationFlow> flows = applicationFlowMapper.selectList(qw);

        List<Map<String, Object>> result = new ArrayList<>();
        for (ApplicationFlow flow : flows) {
            RecruitmentJob job = recruitmentJobMapper.selectById(flow.getJobId());
            StudentResume resume = studentMap.get(flow.getStudentId());
            
            Map<String, Object> item = new HashMap<>();
            item.put("id", flow.getId());
            item.put("jobId", flow.getJobId());
            item.put("jobTitle", job != null ? job.getTitle() : "未知社团");
            item.put("clubName", job != null ? job.getClubName() : "未知社团");
            item.put("category", job != null ? job.getCategory() : "");
            item.put("matchScore", flow.getMatchScore() != null ? flow.getMatchScore().intValue() : 0);
            item.put("stage", flow.getStage() != null ? flow.getStage() : 0);
            item.put("createTime", flow.getCreateTime());
            item.put("realName", resume != null ? resume.getRealName() : "");
            item.put("major", resume != null ? resume.getMajor() : "");
            item.put("personalStatement", resume != null ? resume.getPersonalStatement() : "");
            result.add(item);
        }
        return Result.success(result);
    }

    @GetMapping("/all-applications")
    public Result<List<Map<String, Object>>> getAllApplications(
            @RequestParam(value = "jobId", required = false) Long jobId) {

        com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<ApplicationFlow> qw = new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<>();
        if (jobId != null) qw.eq("job_id", jobId);
        qw.orderByDesc("match_score");

        List<ApplicationFlow> flows = applicationFlowMapper.selectList(qw);
        List<Map<String, Object>> result = new ArrayList<>();

        for (ApplicationFlow flow : flows) {
            RecruitmentJob job = recruitmentJobMapper.selectById(flow.getJobId());
            StudentResume resume = studentResumeMapper.selectById(flow.getStudentId());

            Map<String, Object> item = new HashMap<>();
            item.put("id", flow.getId());
            item.put("jobId", flow.getJobId());
            item.put("jobTitle", job != null ? job.getTitle() : "未知岗位");
            item.put("clubName", job != null ? job.getClubName() : "");
            item.put("matchScore", flow.getMatchScore() != null ? flow.getMatchScore().intValue() : 0);
            item.put("stage", flow.getStage() != null ? flow.getStage() : 0);
            item.put("createTime", flow.getCreateTime());
            item.put("realName", resume != null && resume.getRealName() != null ? resume.getRealName() : "候选人#" + flow.getId());
            item.put("contactPhone", resume != null ? resume.getContactPhone() : "");
            item.put("major", resume != null ? resume.getMajor() : "");
            item.put("personalStatement", resume != null ? resume.getPersonalStatement() : "");
            item.put("structuredData", resume != null ? resume.getStructuredData() : "{}");
            item.put("hasResume", resume != null && resume.getRawText() != null && !resume.getRawText().equals("Form Only Application"));
            result.add(item);
        }
        return Result.success(result);
    }

    @PutMapping("/application/{id}/stage")
    public Result<String> updateStage(@PathVariable(value = "id") Long id, @RequestParam(value = "stage") Integer stage) {
        ApplicationFlow flow = applicationFlowMapper.selectById(id);
        if (flow == null) return Result.error(404, "申请不存在");
        flow.setStage(stage);
        flow.setUpdateTime(LocalDateTime.now());
        applicationFlowMapper.updateById(flow);
        return Result.success("状态已更新");
    }

    @PostMapping("/apply/{jobId}")
    public Result<ApplicationFlow> applyJob(@PathVariable(value = "jobId") Long jobId,
                                             @RequestParam(value = "studentId", required = false) Long studentId) {
        if (studentId == null) {
            return Result.error(400, "学生简历ID不能为空");
        }

        // 1. Get the userId for this studentId to check ALL their resumes
        StudentResume currentResume = studentResumeMapper.selectById(studentId);
        if (currentResume == null) {
            return Result.error(404, "简历不存在");
        }
        Long userId = currentResume.getUserId();

        // 2. Find all resume IDs for this user
        List<StudentResume> userResumes = studentResumeMapper.selectList(
            new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<StudentResume>().eq("user_id", userId)
        );
        List<Long> resumeIds = userResumes.stream().map(StudentResume::getId).collect(Collectors.toList());

        // 3. Check if any of these resumes have already applied for this jobId
        Long count = applicationFlowMapper.selectCount(
            new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<ApplicationFlow>()
                .eq("job_id", jobId)
                .in("student_id", resumeIds)
        );

        if (count > 0) {
            return Result.error(409, "您已投递过该社团，请勿重复投递");
        }

        RecruitmentJob job = recruitmentJobMapper.selectById(jobId);
        if (job == null) {
            return Result.error(404, "社团招新信息不存在");
        }

        BigDecimal matchScore = matchingEngineService.calculateMatchScore(
                job.getRequirementTags(), 
                currentResume.getStructuredData()
        );

        ApplicationFlow flow = new ApplicationFlow();
        flow.setJobId(jobId);
        flow.setStudentId(studentId);
        flow.setMatchScore(matchScore);
        flow.setStage(0); 
        flow.setCreateTime(LocalDateTime.now());
        flow.setUpdateTime(LocalDateTime.now());

        applicationFlowMapper.insert(flow);
        return Result.success(flow);
    }

    @GetMapping("/profile/{userId}")
    public Result<Map<String, Object>> getProfile(@PathVariable(value = "userId") Long userId) {
        com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<StudentResume> rQuery = new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<>();
        rQuery.eq("user_id", userId).orderByDesc("id").last("limit 1");
        StudentResume resume = studentResumeMapper.selectOne(rQuery);

        com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<StudentProfile> pQuery = new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<>();
        pQuery.eq("user_id", userId).orderByDesc("id").last("limit 1");
        StudentProfile profile = studentProfileMapper.selectOne(pQuery);

        Map<String, Object> result = new HashMap<>();
        if (resume != null) {
            result.put("realName", resume.getRealName());
            result.put("major", resume.getMajor());
            result.put("contact", resume.getContactPhone());
        } else {
            result.put("realName", "同学");
            result.put("major", "未知专业");
        }

        if (profile != null) {
            result.put("college", "信息工程学院");
            result.put("interests", profile.getInterestTags());
            result.put("personality", profile.getPersonalityType());
        }
        
        return Result.success(result);
    }
}