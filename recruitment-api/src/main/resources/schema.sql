-- CREATE DATABASE IF NOT EXISTS recruitment DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE recruitment;

CREATE TABLE IF NOT EXISTS `recruitment_job` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `club_id` BIGINT NOT NULL COMMENT '社团ID',
  `club_name` VARCHAR(100) COMMENT '社团名称',
  `category` VARCHAR(50) COMMENT '领域类别(体育, 艺术, 技术等)',
  `title` VARCHAR(255) NOT NULL COMMENT '岗位名称',
  `description` TEXT COMMENT '宣发内容(包含AI生成的文案)',
  `requirement_tags` JSON COMMENT '岗位要求标签',
  `slots` INT DEFAULT 1 COMMENT '招募人数',
  `status` TINYINT DEFAULT 1 COMMENT '0:关闭, 1:开启',
  `established_year` VARCHAR(20) COMMENT '成立年份',
  `org_level` VARCHAR(50) COMMENT '组织级别',
  `guidance_unit` VARCHAR(100) COMMENT '指导/挂靠单位',
  `main_activities` TEXT COMMENT '主要活动内容',
  `representative_activities` TEXT COMMENT '历年代表/品牌活动',
  `member_size` VARCHAR(50) COMMENT '成员规模',
  `activity_frequency` VARCHAR(100) COMMENT '活动频率',
  `publicity_channels` VARCHAR(255) COMMENT '主要宣传渠道',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP
) COMMENT='招新岗位表';

CREATE TABLE IF NOT EXISTS `sys_user` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `school_email` VARCHAR(100) NOT NULL UNIQUE COMMENT '学校邮箱 (SSO)',
  `password` VARCHAR(100) NOT NULL COMMENT '密码',
  `token` VARCHAR(255) COMMENT '当前登录态Token',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP
) COMMENT='系统用户表';

CREATE TABLE IF NOT EXISTS `student_resume` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT NOT NULL COMMENT '学生用户ID',
  `real_name` VARCHAR(100) COMMENT '真实姓名（盲审时不展示）',
  `contact_phone` VARCHAR(50) COMMENT '联系方式',
  `major` VARCHAR(100) COMMENT '专业',
  `personal_statement` TEXT COMMENT '个人介绍/自我陈述',
  `portfolio_url` VARCHAR(255) COMMENT '作品集链接',
  `raw_text` TEXT COMMENT 'PDF提取的原始文本',
  `structured_data` JSON COMMENT 'AI解析后的技能/经历',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP
) COMMENT='学生简历表';

CREATE TABLE IF NOT EXISTS `application_flow` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `job_id` BIGINT NOT NULL COMMENT '岗位ID',
  `student_id` BIGINT NOT NULL COMMENT '学生ID(关联user_id)',
  `match_score` DECIMAL(5,2) DEFAULT '0.00' COMMENT 'AI计算匹配分(0-100)',
  `stage` TINYINT DEFAULT 0 COMMENT '0:初筛, 1:面试, 2:录取, 3:淘汰',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP
) COMMENT='申请流水表';

CREATE TABLE IF NOT EXISTS `student_profile` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT NOT NULL UNIQUE COMMENT '学生用户ID',
  `interest_tags` JSON COMMENT '兴趣标签列表',
  `weekly_free_hours` INT DEFAULT 5 COMMENT '每周可用达小时数',
  `commitment_level` VARCHAR(10) DEFAULT 'MED' COMMENT 'LOW/MED/HIGH',
  `personality_type` VARCHAR(50) COMMENT '心理类型',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP
) COMMENT='学生个人画像表';

CREATE TABLE IF NOT EXISTS `student_preference` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT NOT NULL COMMENT '学生用户ID',
  `job_id` BIGINT NOT NULL COMMENT '意向岗位ID',
  `rank_order` INT NOT NULL COMMENT '对应的得分排名(越小越好)',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP
) COMMENT='学生意向岗位排序表(Gale-Shapley ROL)';

-- Dummy data
INSERT INTO `recruitment_job` (`club_id`, `club_name`, `category`, `title`, `description`, `requirement_tags`, `slots`) VALUES 
(1, '首尔大音协', '艺术', '校园音乐节主唱', '加入音协，开启你的音乐梦想。', '["歌唱", "舞台设计", "乐理"]', 2),
(2, '山河摄影社', '艺术', '纪实摄影大咖', '记录校园的点滴，发现生活的美。', '["摄影", "Lightroom", "审美"]', 3),
(4, '篮球社', '体育', '校队后备力量', '热血篮球，无愧青春。', '["体能", "团队合作", "篮球"]', 10);
