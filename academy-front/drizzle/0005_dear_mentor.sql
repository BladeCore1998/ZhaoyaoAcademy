SET NAMES utf8mb4;
--> statement-breakpoint
ALTER TABLE `playlist` ADD `sort_order` int DEFAULT 0 NOT NULL COMMENT '展示排序，数字越小越靠前';
--> statement-breakpoint
ALTER TABLE `booklist` ADD `sort_order` int DEFAULT 0 NOT NULL COMMENT '展示排序，数字越小越靠前';
--> statement-breakpoint
UPDATE `playlist` AS `p`
JOIN (
  SELECT `id`, ROW_NUMBER() OVER (ORDER BY `created_at` DESC, `id` DESC) - 1 AS `position`
  FROM `playlist`
) AS `ranked` ON `ranked`.`id` = `p`.`id`
SET `p`.`sort_order` = `ranked`.`position`;
--> statement-breakpoint
UPDATE `booklist` AS `b`
JOIN (
  SELECT `id`, ROW_NUMBER() OVER (ORDER BY `created_at` DESC, `id` DESC) - 1 AS `position`
  FROM `booklist`
) AS `ranked` ON `ranked`.`id` = `b`.`id`
SET `b`.`sort_order` = `ranked`.`position`;