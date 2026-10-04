ALTER TABLE `booklist`
  ADD `status` enum('未读','在读','已读') DEFAULT '未读' NOT NULL COMMENT '阅读状态';
--> statement-breakpoint
UPDATE `booklist`
SET `status` = CASE `book_name`
  WHEN '明朝那些事儿' THEN '在读'
  WHEN '纳瓦尔宝典' THEN '在读'
  WHEN '苏东坡传' THEN '已读'
  WHEN '被讨厌的勇气' THEN '已读'
  ELSE '未读'
END;
