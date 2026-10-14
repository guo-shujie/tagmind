-- ============================================
-- TagMind 数据库初始化脚本
-- ============================================
-- 说明：
-- 1. 本脚本用于初始化 TagMind 数据库，包括创建用户表、内容表、标签表等。
-- 2. 数据库字符集统一为 utf8mb4，支持多语言和表情符号。
-- 3. 外键检查在脚本开始时关闭，结束时重新启用，避免外键依赖问题。
-- ============================================

-- 设置字符集为 utf8mb4
SET NAMES utf8mb4;

-- 暂时关闭外键检查，避免创建表时的依赖问题
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- 表 1：用户表
-- ============================================
-- 说明：
-- 用户表存储用户的基本信息，包括用户名、邮箱、密码哈希等。
-- 每个用户都有唯一的用户名和邮箱。
CREATE TABLE IF NOT EXISTS users (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, -- 用户ID，自增主键
  username      VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名', -- 用户名，唯一
  email         VARCHAR(100) NOT NULL UNIQUE COMMENT '邮箱', -- 邮箱地址，唯一
  password_hash VARCHAR(255) NOT NULL COMMENT '密码哈希', -- 用户密码的哈希值
  avatar_url    VARCHAR(255) DEFAULT NULL COMMENT '头像', -- 用户头像URL
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP, -- 创建时间
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- 更新时间
  INDEX idx_email (email) -- 邮箱索引，用于快速查询
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ============================================
-- 表 2：内容表
-- ============================================
-- 说明：
-- 内容表存储用户发布的内容，包括标题、正文、来源等信息。
-- 支持全文索引和多种状态管理。
CREATE TABLE IF NOT EXISTS contents (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, -- 内容ID，自增主键
  user_id       BIGINT UNSIGNED NOT NULL COMMENT '所属用户', -- 发布内容的用户ID
  title         VARCHAR(255) NOT NULL COMMENT '标题', -- 内容标题
  content_text  MEDIUMTEXT NOT NULL COMMENT '正文内容', -- 内容正文
  source_type   ENUM('manual', 'url', 'import') DEFAULT 'manual' COMMENT '来源类型', -- 内容来源类型
  source_url    VARCHAR(500) DEFAULT NULL COMMENT '来源URL', -- 来源URL（如果有）
  summary       TEXT DEFAULT NULL COMMENT 'AI生成摘要', -- AI生成的内容摘要
  sentiment     ENUM('positive', 'neutral', 'negative', 'pending') DEFAULT 'pending' COMMENT '情感倾向', -- 内容情感分析结果
  status        ENUM('draft', 'analyzing', 'published', 'archived') DEFAULT 'draft' COMMENT '状态', -- 内容状态
  view_count    INT DEFAULT 0 COMMENT '浏览次数', -- 内容浏览次数
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP, -- 创建时间
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- 更新时间
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, -- 外键约束，用户删除时级联删除内容
  INDEX idx_user_status (user_id, status), -- 用户ID和状态的联合索引
  INDEX idx_created (created_at), -- 创建时间索引
  FULLTEXT INDEX ft_content (title, content_text) WITH PARSER ngram -- 全文索引，支持中文分词
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='内容表';

-- ============================================
-- 表 3：标签表（自引用层级树）
-- ============================================
-- 说明：
-- 标签表存储用户创建的标签信息，支持层级结构（父标签-子标签）。
CREATE TABLE IF NOT EXISTS tags (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, -- 标签ID，自增主键
  user_id       BIGINT UNSIGNED NOT NULL COMMENT '所属用户', -- 创建标签的用户ID
  name          VARCHAR(50) NOT NULL COMMENT '标签名', -- 标签名称
  slug          VARCHAR(50) NOT NULL COMMENT 'URL友好标识', -- 标签的URL友好标识
  parent_id     BIGINT UNSIGNED DEFAULT NULL COMMENT '父标签ID', -- 父标签ID（支持层级结构）
  description   VARCHAR(255) DEFAULT NULL COMMENT '描述', -- 标签描述
  color         VARCHAR(20) DEFAULT '#1890ff' COMMENT '标签颜色', -- 标签颜色
  usage_count   INT DEFAULT 0 COMMENT '被引用次数', -- 标签被引用的次数
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP, -- 创建时间
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, -- 外键约束，用户删除时级联删除标签
  FOREIGN KEY (parent_id) REFERENCES tags(id) ON DELETE SET NULL, -- 父标签删除时设置为 NULL
  UNIQUE KEY uk_user_slug (user_id, slug), -- 用户ID和slug的联合唯一约束
  INDEX idx_parent (parent_id), -- 父标签索引
  INDEX idx_user (user_id) -- 用户ID索引
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='标签表';

-- ============================================
-- 表 4：内容-标签关联表（多对多中间表）
-- ============================================
-- 说明：
-- 内容与标签的多对多关系表，用于存储内容与标签的关联信息。
CREATE TABLE IF NOT EXISTS contents_tags (
  content_id    BIGINT UNSIGNED NOT NULL, -- 内容ID
  tag_id        BIGINT UNSIGNED NOT NULL, -- 标签ID
  confidence    DECIMAL(3,2) DEFAULT 1.00 COMMENT 'AI打标签置信度', -- AI打标签的置信度
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP, -- 创建时间
  PRIMARY KEY (content_id, tag_id), -- 联合主键，确保唯一性
  FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE, -- 外键约束，内容删除时级联删除关联
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE, -- 外键约束，标签删除时级联删除关联
  INDEX idx_tag (tag_id), -- 标签ID索引
  INDEX idx_content (content_id) -- 内容ID索引
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='内容标签关联表';

-- ============================================
-- 表 5：AI 分析任务表
-- ============================================
-- 说明：
-- AI 分析任务表存储与内容相关的 AI 分析任务信息，包括任务类型、状态、结果等。
CREATE TABLE IF NOT EXISTS ai_tasks (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, -- 任务ID，自增主键
  task_id       VARCHAR(100) NOT NULL UNIQUE COMMENT 'BullMQ任务ID', -- BullMQ 任务唯一标识
  content_id    BIGINT UNSIGNED NOT NULL, -- 关联的内容ID
  type          ENUM('summarize', 'tagging', 'sentiment', 'full_analysis') NOT NULL COMMENT '任务类型', -- 任务类型
  status        ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending' COMMENT '任务状态', -- 任务状态
  progress      TINYINT DEFAULT 0 COMMENT '进度0-100', -- 任务进度
  result        JSON DEFAULT NULL COMMENT '任务结果', -- 任务结果（JSON 格式）
  error_message TEXT DEFAULT NULL, -- 错误信息
  retries       INT DEFAULT 0 COMMENT '已重试次数', -- 重试次数
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP, -- 创建时间
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- 更新时间
  FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE, -- 外键约束，内容删除时级联删除任务
  INDEX idx_status (status), -- 状态索引
  INDEX idx_content (content_id), -- 内容ID索引
  INDEX idx_task_id (task_id) -- 任务ID索引
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI任务表';

-- 重新启用外键检查
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- 插入一个测试用户
-- ============================================
-- 插入一个测试用户，用户名为 admin，邮箱为 admin@tagmind.dev。
-- 密码哈希为 bcrypt 加密后的 "123456"（仅供测试使用）。
INSERT INTO users (username, email, password_hash) VALUES
('admin', 'admin@tagmind.dev', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy');