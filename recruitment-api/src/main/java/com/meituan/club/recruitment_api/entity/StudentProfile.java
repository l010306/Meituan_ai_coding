package com.meituan.club.recruitment_api.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("student_profile")
public class StudentProfile {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;
    // Interest tags as JSON string, e.g. ["音乐", "编程", "摄影"]
    private String interestTags;
    // Weekly free time in hours
    private Integer weeklyFreeHours;
    // Commitment level: LOW, MED, HIGH
    private String commitmentLevel;
    // Personality type from the survey
    private String personalityType;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
}
