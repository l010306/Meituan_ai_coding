package com.meituan.club.recruitment_api.service.impl;

import com.meituan.club.recruitment_api.service.AiService;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.openai.OpenAiChatModel;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnProperty(name="llm.enabled", havingValue="true")
public class LangChainAiServiceImpl implements AiService {

    @Value("${llm.api-key}")
    private String apiKey;

    @Value("${llm.base-url}")
    private String baseUrl;

    @Value("${llm.model-name}")
    private String modelName;

    private ChatLanguageModel chatLanguageModel;

    @PostConstruct
    public void init() {
        this.chatLanguageModel = OpenAiChatModel.builder()
                .apiKey(apiKey)
                .baseUrl(baseUrl)
                .modelName(modelName)
                .build();
    }

    @Override
    public String generateJobDescription(String keywords) {
        String prompt = "You are an HR assistant for a university club. " +
                "Generate a highly attractive recruitment job description based on these keywords: " +
                keywords + ". Keep it under 200 words and professional but passionate.";
        return chatLanguageModel.generate(prompt);
    }

    @Override
    public String extractStructuredResumeInfo(String rawText) {
        String prompt = "Extract skills and a short experience summary from the following resume text. " +
                "Return exactly a JSON object with 'skills' (array of strings) and 'experience' (string). " +
                "Resume:\n" + rawText;
        return chatLanguageModel.generate(prompt);
    }
}
