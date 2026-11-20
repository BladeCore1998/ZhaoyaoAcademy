SET NAMES utf8mb4;
--> statement-breakpoint
ALTER TABLE `marshmallow` ADD `is_pinned` boolean DEFAULT false NOT NULL COMMENT '是否置顶';
--> statement-breakpoint
ALTER TABLE `marshmallow` ADD `sort_order` int DEFAULT 0 NOT NULL COMMENT '展示排序，数字越小越靠前';
--> statement-breakpoint
UPDATE `marshmallow` AS `m`
JOIN (
  SELECT `id`, ROW_NUMBER() OVER (ORDER BY `created_at` DESC, `id` DESC) - 1 AS `position`
  FROM `marshmallow`
) AS `ranked` ON `ranked`.`id` = `m`.`id`
SET `m`.`sort_order` = `ranked`.`position`;