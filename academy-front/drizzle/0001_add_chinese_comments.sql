SET NAMES utf8mb4;
--> statement-breakpoint
ALTER TABLE `account`
  COMMENT = '第三方账户及认证信息',
  MODIFY COLUMN `id` varchar(36) NOT NULL COMMENT '账户记录唯一标识',
  MODIFY COLUMN `account_id` varchar(255) NOT NULL COMMENT '外部账户标识',
  MODIFY COLUMN `provider_id` varchar(255) NOT NULL COMMENT '认证提供商标识',
  MODIFY COLUMN `user_id` varchar(36) NOT NULL COMMENT '关联用户ID',
  MODIFY COLUMN `access_token` text COMMENT '访问令牌',
  MODIFY COLUMN `refresh_token` text COMMENT '刷新令牌',
  MODIFY COLUMN `id_token` text COMMENT '身份令牌',
  MODIFY COLUMN `access_token_expires_at` datetime COMMENT '访问令牌过期时间',
  MODIFY COLUMN `refresh_token_expires_at` datetime COMMENT '刷新令牌过期时间',
  MODIFY COLUMN `scope` text COMMENT '授权范围',
  MODIFY COLUMN `password` text COMMENT '密码凭据',
  MODIFY COLUMN `created_at` datetime NOT NULL COMMENT '创建时间',
  MODIFY COLUMN `updated_at` datetime NOT NULL COMMENT '更新时间';
--> statement-breakpoint
ALTER TABLE `booklist`
  COMMENT = '书单内容',
  MODIFY COLUMN `id` int AUTO_INCREMENT NOT NULL COMMENT '书单唯一标识',
  MODIFY COLUMN `title` varchar(255) NOT NULL COMMENT '书单标题',
  MODIFY COLUMN `summary` text COMMENT '书单简介',
  MODIFY COLUMN `cover_url` text COMMENT '封面地址',
  MODIFY COLUMN `is_published` boolean NOT NULL DEFAULT false COMMENT '是否公开发布',
  MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT (now()) COMMENT '创建时间';
--> statement-breakpoint
ALTER TABLE `marshmallow`
  COMMENT = '棉花糖留言',
  MODIFY COLUMN `id` int AUTO_INCREMENT NOT NULL COMMENT '留言唯一标识',
  MODIFY COLUMN `user_id` varchar(36) COMMENT '留言用户ID',
  MODIFY COLUMN `content` text NOT NULL COMMENT '留言内容',
  MODIFY COLUMN `admin_reply` text COMMENT '管理员回复',
  MODIFY COLUMN `status` varchar(32) NOT NULL DEFAULT 'pending' COMMENT '留言状态',
  MODIFY COLUMN `is_public` boolean NOT NULL DEFAULT false COMMENT '是否公开展示',
  MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT (now()) COMMENT '创建时间';
--> statement-breakpoint
ALTER TABLE `playlist`
  COMMENT = '歌单内容',
  MODIFY COLUMN `id` int AUTO_INCREMENT NOT NULL COMMENT '歌单唯一标识',
  MODIFY COLUMN `title` varchar(255) NOT NULL COMMENT '歌单标题',
  MODIFY COLUMN `summary` text COMMENT '歌单简介',
  MODIFY COLUMN `cover_url` text COMMENT '封面地址',
  MODIFY COLUMN `is_published` boolean NOT NULL DEFAULT false COMMENT '是否公开发布',
  MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT (now()) COMMENT '创建时间';
--> statement-breakpoint
ALTER TABLE `session`
  COMMENT = '用户登录会话',
  MODIFY COLUMN `id` varchar(36) NOT NULL COMMENT '会话唯一标识',
  MODIFY COLUMN `expires_at` datetime NOT NULL COMMENT '会话过期时间',
  MODIFY COLUMN `token` varchar(255) NOT NULL COMMENT '会话令牌',
  MODIFY COLUMN `created_at` datetime NOT NULL COMMENT '创建时间',
  MODIFY COLUMN `updated_at` datetime NOT NULL COMMENT '更新时间',
  MODIFY COLUMN `ip_address` varchar(255) COMMENT '登录IP地址',
  MODIFY COLUMN `user_agent` text COMMENT '客户端User-Agent',
  MODIFY COLUMN `user_id` varchar(36) NOT NULL COMMENT '关联用户ID';
--> statement-breakpoint
ALTER TABLE `user`
  COMMENT = '用户账户',
  MODIFY COLUMN `id` varchar(36) NOT NULL COMMENT '用户唯一标识',
  MODIFY COLUMN `name` varchar(255) NOT NULL COMMENT '用户名称',
  MODIFY COLUMN `email` varchar(255) NOT NULL COMMENT '用户邮箱',
  MODIFY COLUMN `email_verified` boolean NOT NULL DEFAULT false COMMENT '邮箱是否已验证',
  MODIFY COLUMN `image` text COMMENT '用户头像地址',
  MODIFY COLUMN `role` varchar(32) NOT NULL DEFAULT 'user' COMMENT '用户角色',
  MODIFY COLUMN `created_at` datetime NOT NULL COMMENT '创建时间',
  MODIFY COLUMN `updated_at` datetime NOT NULL COMMENT '更新时间';
--> statement-breakpoint
ALTER TABLE `verification`
  COMMENT = '验证码及验证令牌',
  MODIFY COLUMN `id` varchar(36) NOT NULL COMMENT '验证记录唯一标识',
  MODIFY COLUMN `identifier` varchar(255) NOT NULL COMMENT '验证目标标识',
  MODIFY COLUMN `value` text NOT NULL COMMENT '验证码或验证值',
  MODIFY COLUMN `expires_at` datetime NOT NULL COMMENT '验证过期时间',
  MODIFY COLUMN `created_at` datetime COMMENT '创建时间',
  MODIFY COLUMN `updated_at` datetime COMMENT '更新时间';
