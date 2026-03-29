package com.meituan.club.recruitment_api.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.meituan.club.recruitment_api.common.Result;
import com.meituan.club.recruitment_api.entity.ApplicationFlow;
import com.meituan.club.recruitment_api.entity.RecruitmentJob;
import com.meituan.club.recruitment_api.entity.StudentResume;
import com.meituan.club.recruitment_api.mapper.ApplicationFlowMapper;
import com.meituan.club.recruitment_api.mapper.RecruitmentJobMapper;
import com.meituan.club.recruitment_api.mapper.StudentResumeMapper;
import com.meituan.club.recruitment_api.service.AiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@CrossOrigin
@RestController
@RequestMapping("/api/v1/recruitment/jobs")
public class ClubController {

    @Autowired
    private AiService aiService;

    @Autowired
    private ApplicationFlowMapper applicationFlowMapper;

    @Autowired
    private StudentResumeMapper studentResumeMapper;

    @Autowired
    private RecruitmentJobMapper recruitmentJobMapper;

    @PostMapping("/generate-jd")
    public Result<String> generateJd(@RequestBody Map<String, String> request) {
        String keywords = request.getOrDefault("keywords", "校园活动");
        String jd = aiService.generateJobDescription(keywords);
        return Result.success(jd);
    }

    @GetMapping("/clubs")
    public Result<List<RecruitmentJob>> getAllClubs() {
        // Fetch all jobs, then group by clubName to get unique clubs and their representative info
        List<RecruitmentJob> allJobs = recruitmentJobMapper.selectList(null);
        Map<String, RecruitmentJob> uniqueClubs = new LinkedHashMap<>();
        for (RecruitmentJob job : allJobs) {
            if (!uniqueClubs.containsKey(job.getClubName())) {
                uniqueClubs.put(job.getClubName(), job);
            }
        }
        return Result.success(new ArrayList<>(uniqueClubs.values()));
    }

    @GetMapping("/{id}/applicants")
    public Result<List<Map<String, Object>>> getApplicants(@PathVariable Long id) {
        // 先获取岗位所有的投递记录，按 AI 匹配得分排序
        QueryWrapper<ApplicationFlow> flowQuery = new QueryWrapper<>();
        flowQuery.eq("job_id", id).orderByDesc("match_score");
        List<ApplicationFlow> flows = applicationFlowMapper.selectList(flowQuery);

        // 构建匿名化列表返回，隐去姓名和照片等偏见因素
        List<Map<String, Object>> resultList = new ArrayList<>();
        int rank = 1;
        for (ApplicationFlow flow : flows) {
            Map<String, Object> map = new HashMap<>();
            map.put("applyId", flow.getId());
            map.put("anonymousName", "候选人 " + rank++);
            map.put("matchScore", flow.getMatchScore());
            map.put("stage", flow.getStage());
            
            StudentResume resume = studentResumeMapper.selectById(flow.getStudentId());
            if (resume != null) {
                map.put("structuredData", resume.getStructuredData());
            }
            resultList.add(map);
        }
        return Result.success(resultList);
    }
}
