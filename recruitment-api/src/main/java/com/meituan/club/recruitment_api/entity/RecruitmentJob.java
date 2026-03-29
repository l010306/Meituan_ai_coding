package com.meituan.club.recruitment_api.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("recruitment_job")
public class RecruitmentJob {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long clubId;
    private String clubName;
    private String category;
    private String title;
    private String description;
    private String requirementTags; // JSON string
    private Integer slots;
    private Integer status;
    private String establishedYear;
    private String orgLevel;
    private String guidanceUnit;
    private String mainActivities;
    private String representativeActivities;
    private String memberSize;
    private String activityFrequency;
    private String publicityChannels;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
}
