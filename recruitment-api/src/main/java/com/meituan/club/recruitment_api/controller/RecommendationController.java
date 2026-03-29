package com.meituan.club.recruitment_api.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.meituan.club.recruitment_api.common.Result;
import com.meituan.club.recruitment_api.entity.RecruitmentJob;
import com.meituan.club.recruitment_api.entity.StudentProfile;
import com.meituan.club.recruitment_api.mapper.RecruitmentJobMapper;
import com.meituan.club.recruitment_api.mapper.StudentProfileMapper;
import com.meituan.club.recruitment_api.service.MatchingEngineService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

import com.meituan.club.recruitment_api.entity.StudentResume;
import com.meituan.club.recruitment_api.mapper.StudentResumeMapper;

@CrossOrigin(origins = "*", allowedHeaders = "*")
@RestController
@RequestMapping("/api/v1/recommendation")
public class RecommendationController {

    @Autowired
    private StudentProfileMapper studentProfileMapper;

    @Autowired
    private StudentResumeMapper studentResumeMapper;

    @Autowired
    private RecruitmentJobMapper recruitmentJobMapper;

    @Autowired
    private MatchingEngineService matchingEngineService;

    /**
     * Save student interest profile from the involvement calculator survey.
     */
    @PostMapping("/profile")
    public Result<StudentProfile> saveProfile(@RequestBody Map<String, Object> request) {
        Long userId = Long.valueOf(request.get("userId").toString());

        // Check if profile already exists
        QueryWrapper<StudentProfile> qw = new QueryWrapper<>();
        qw.eq("user_id", userId).orderByDesc("id").last("limit 1");
        StudentProfile profile = studentProfileMapper.selectOne(qw);
        
        if (profile == null) {
            profile = new StudentProfile();
            profile.setUserId(userId);
            profile.setCreateTime(LocalDateTime.now());
        }

        profile.setInterestTags(request.get("interestTags").toString());
        profile.setWeeklyFreeHours(Integer.valueOf(request.get("weeklyFreeHours").toString()));
        profile.setCommitmentLevel(request.get("commitmentLevel").toString());
        profile.setPersonalityType(request.get("personalityType").toString());
        profile.setUpdateTime(LocalDateTime.now());

        if (profile.getId() == null) {
            studentProfileMapper.insert(profile);
        } else {
            studentProfileMapper.updateById(profile);
        }

        return Result.success(profile);
    }

    @GetMapping("/jobs/{userId}")
    public Result<List<Map<String, Object>>> getRecommendedJobs(@PathVariable Long userId) {
        try {
            System.out.println("[Recommendation] Processing user: " + userId);
            
            // 1. Fetch survey-based profile
            StudentProfile profile = studentProfileMapper.selectOne(
                new QueryWrapper<StudentProfile>().eq("user_id", userId).orderByDesc("id").last("limit 1")
            );

            // 2. Fetch resume-based profile
            StudentResume resume = studentResumeMapper.selectOne(
                new QueryWrapper<StudentResume>().eq("user_id", userId).orderByDesc("id").last("limit 1")
            );

            // 3. Get all jobs
            List<RecruitmentJob> allJobs = recruitmentJobMapper.selectList(new QueryWrapper<>());
            System.out.println("[Recommendation] Total jobs found in DB: " + allJobs.size());

            List<Map<String, Object>> ranked = new ArrayList<>();

            // 4. Fallback if no profile info
            if (profile == null && resume == null) {
                System.out.println("[Recommendation] No profile found for user, using cold start latest jobs");
                allJobs.sort(Comparator.comparing(RecruitmentJob::getCreateTime, Comparator.nullsLast(Comparator.reverseOrder())));
                for (int i = 0; i < Math.min(allJobs.size(), 12); i++) {
                    Map<String, Object> entry = new HashMap<>();
                    entry.put("job", allJobs.get(i));
                    entry.put("matchScore", 0);
                    entry.put("reason", "为您推荐最新入驻的社团（测试环境兜底）");
                    ranked.add(entry);
                }
                return Result.success(ranked);
            }

            // 5. Aggregate student context for text similarity
            StringBuilder contextBuilder = new StringBuilder();
            if (profile != null) {
                contextBuilder.append(profile.getInterestTags()).append(" ").append(profile.getPersonalityType());
            }
            if (resume != null) {
                contextBuilder.append(" 专业:").append(resume.getMajor()).append(" 核心背景:").append(resume.getPersonalStatement());
            }
            String studentText = contextBuilder.toString();
            System.out.println("[Recommendation] Student Context: " + studentText);

            // 6. Calculate scores
            for (RecruitmentJob job : allJobs) {
                try {
                    // Use Text Similarity instead of MatchScore (JSON-based)
                    BigDecimal score = matchingEngineService.calculateTextSimilarity(
                        studentText, 
                        (job.getClubName() + " " + job.getTitle() + " " + job.getDescription() + " " + job.getRequirementTags())
                    );
                    
                    Map<String, Object> entry = new HashMap<>();
                    entry.put("job", job);
                    entry.put("matchScore", score);

                    boolean highRisk = (profile != null && "LOW".equals(profile.getCommitmentLevel()))
                            && job.getSlots() != null && job.getSlots() <= 2;
                    entry.put("churnRisk", highRisk ? "HIGH" : "LOW");
                    
                    entry.put("reason", buildEnhancedReason(resume, profile, job, score.doubleValue()));
                    ranked.add(entry);
                } catch (Exception e) {
                    System.err.println("[Recommendation] Error ranking job " + job.getId() + ": " + e.getMessage());
                }
            }

            // 7. Sort and limit
            ranked.sort((a, b) -> Double.compare(
                ((Number) b.get("matchScore")).doubleValue(),
                ((Number) a.get("matchScore")).doubleValue()
            ));

            int limit = Math.min(ranked.size(), 12);
            return Result.success(ranked.subList(0, limit));

        } catch (Exception e) {
            e.printStackTrace();
            return Result.error(500, "推荐接口系统错误: " + e.getMessage());
        }
    }

    private String buildEnhancedReason(StudentResume resume, StudentProfile profile, RecruitmentJob job, double score) {
        String base = score > 70 ? "高度契合" : score > 40 ? "相性良好" : "值得探索";
        if (resume != null && job.getRequirementTags() != null && job.getRequirementTags().contains(resume.getMajor())) {
            return String.format("基于您的专业背景 (%s) 及兴趣推荐，匹配度 %s", resume.getMajor(), base);
        }
        return String.format("深度解析您的跨维画像，与该社团达到 %s（%.0f%%）", base, score);
    }

    private String buildRecommendationReason(StudentProfile profile, RecruitmentJob job, double score) {
        String level = score > 70 ? "高度匹配" : score > 40 ? "部分匹配" : "低度匹配";
        return String.format("根据你的兴趣画像，与该岗位语义%s（相似度 %.0f%%）", level, score);
    }
}
