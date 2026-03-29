package com.meituan.club.recruitment_api.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("application_flow")
public class ApplicationFlow {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long jobId;
    private Long studentId;
    private BigDecimal matchScore;
    private Integer stage;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
}
