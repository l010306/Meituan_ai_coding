package com.meituan.club.recruitment_api.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("student_resume")
public class StudentResume {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;
    // Structured personal info from the application form
    private String realName;       // 真实姓名 (stored, masked in blind review)
    private String contactPhone;   // 联系方式
    private String major;          // 专业
    private String personalStatement; // 个人介绍 / 自我陈述
    private String portfolioUrl;      // 作品集链接
    private String rawText;
    private String structuredData; // JSON string from AI parsing
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
}
