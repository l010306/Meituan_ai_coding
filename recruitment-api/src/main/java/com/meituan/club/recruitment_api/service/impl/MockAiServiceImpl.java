package com.meituan.club.recruitment_api.service.impl;

import com.alibaba.fastjson2.JSONObject;
import com.meituan.club.recruitment_api.service.AiService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import java.util.Arrays;

@Service
@ConditionalOnProperty(name="llm.enabled", havingValue="false", matchIfMissing=true)
public class MockAiServiceImpl implements AiService {

    @Override
    public String generateJobDescription(String keywords) {
        return "【模拟AI生成JD】这是一份基于关键词 [" + keywords + "] 自动生成的招新文案。\n" +
               "我们在寻找充满热情的同学加入我们！你需要具备相关的基本能力，" +
               "并且有强烈的责任心和团队合作精神。";
    }

    @Override
    public String extractStructuredResumeInfo(String rawText) {
        // 模拟提取技能和经验
        JSONObject json = new JSONObject();
        if (rawText != null && rawText.toLowerCase().contains("java")) {
            json.put("skills", Arrays.asList("Java", "Spring Boot", "MySQL"));
        } else {
            json.put("skills", Arrays.asList("沟通能力", "组织策划"));
        }
        json.put("experience", "【模拟】曾参与校园活动组织，具有一定实干经验。");
        return json.toJSONString();
    }
}
