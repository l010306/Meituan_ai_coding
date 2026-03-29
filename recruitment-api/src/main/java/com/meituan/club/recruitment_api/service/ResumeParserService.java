package com.meituan.club.recruitment_api.service;

import org.apache.tika.Tika;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.InputStream;

@Service
public class ResumeParserService {

    private final AiService aiService;

    public ResumeParserService(AiService aiService) {
        this.aiService = aiService;
    }

    /**
     * 解析上传的PDF简历
     */
    public String parsePdfToText(MultipartFile file) {
        try (InputStream stream = file.getInputStream()) {
            Tika tika = new Tika();
            return tika.parseToString(stream);
        } catch (Exception e) {
            e.printStackTrace();
            return "解析失败: " + e.getMessage();
        }
    }

    /**
     * 将解析的纯文本转换为结构化JSON
     */
    public String buildStructuredData(String rawText) {
        return aiService.extractStructuredResumeInfo(rawText);
    }
}
