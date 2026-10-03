SET NAMES utf8mb4;
--> statement-breakpoint
INSERT INTO `playlist` (`title`, `summary`, `cover_url`, `is_published`)
SELECT '七里香', '周杰伦 · 华语 / 流行 · 适合风从窗棂穿过的下午。', '/inspiration/3.webp', true
WHERE NOT EXISTS (SELECT 1 FROM `playlist` WHERE `title` = '七里香');
--> statement-breakpoint
INSERT INTO `playlist` (`title`, `summary`, `cover_url`, `is_published`)
SELECT '如愿', '王菲 · 华语 / 抒情 · 把漫长的心愿唱得很轻。', '/inspiration/3.webp', true
WHERE NOT EXISTS (SELECT 1 FROM `playlist` WHERE `title` = '如愿');
--> statement-breakpoint
INSERT INTO `playlist` (`title`, `summary`, `cover_url`, `is_published`)
SELECT '烟雨行舟', '司南 · 华语 / 古风 · 雨落江南，舟行有声。', '/inspiration/3.webp', true
WHERE NOT EXISTS (SELECT 1 FROM `playlist` WHERE `title` = '烟雨行舟');
--> statement-breakpoint
INSERT INTO `playlist` (`title`, `summary`, `cover_url`, `is_published`)
SELECT '慢慢喜欢你', '莫文蔚 · 华语 / 抒情 · 适合给日子留一点余地。', '/inspiration/3.webp', true
WHERE NOT EXISTS (SELECT 1 FROM `playlist` WHERE `title` = '慢慢喜欢你');
--> statement-breakpoint
INSERT INTO `playlist` (`title`, `summary`, `cover_url`, `is_published`)
SELECT '旅行的意义', '陈绮贞 · 华语 / 民谣 · 一首适合整理行囊的歌。', '/inspiration/3.webp', true
WHERE NOT EXISTS (SELECT 1 FROM `playlist` WHERE `title` = '旅行的意义');
--> statement-breakpoint
INSERT INTO `playlist` (`title`, `summary`, `cover_url`, `is_published`)
SELECT '棠梨煎雪', '银临 · 华语 / 古风 · 春色落在一盏温茶里。', '/inspiration/3.webp', true
WHERE NOT EXISTS (SELECT 1 FROM `playlist` WHERE `title` = '棠梨煎雪');
--> statement-breakpoint
INSERT INTO `playlist` (`title`, `summary`, `cover_url`, `is_published`)
SELECT '听海', '张惠妹 · 华语 / 抒情 · 留给不想急着说话的夜晚。', '/inspiration/3.webp', true
WHERE NOT EXISTS (SELECT 1 FROM `playlist` WHERE `title` = '听海');
--> statement-breakpoint
INSERT INTO `playlist` (`title`, `summary`, `cover_url`, `is_published`)
SELECT '遇见', '孙燕姿 · 华语 / 流行 · 那些恰好发生的相逢。', '/inspiration/3.webp', true
WHERE NOT EXISTS (SELECT 1 FROM `playlist` WHERE `title` = '遇见');
--> statement-breakpoint
INSERT INTO `playlist` (`title`, `summary`, `cover_url`, `is_published`)
SELECT '小幸运', '田馥甄 · 华语 / 流行 · 明亮、轻快，适合重新出发。', '/inspiration/3.webp', true
WHERE NOT EXISTS (SELECT 1 FROM `playlist` WHERE `title` = '小幸运');
--> statement-breakpoint
INSERT INTO `playlist` (`title`, `summary`, `cover_url`, `is_published`)
SELECT '奇妙能力歌', '陈粒 · 华语 / 民谣 · 把微小的情绪唱出形状。', '/inspiration/3.webp', true
WHERE NOT EXISTS (SELECT 1 FROM `playlist` WHERE `title` = '奇妙能力歌');
--> statement-breakpoint
INSERT INTO `playlist` (`title`, `summary`, `cover_url`, `is_published`)
SELECT '青花瓷', '周杰伦 · 华语 / 中国风 · 留一页给雨声和旧窗。', '/inspiration/3.webp', true
WHERE NOT EXISTS (SELECT 1 FROM `playlist` WHERE `title` = '青花瓷');
--> statement-breakpoint
INSERT INTO `playlist` (`title`, `summary`, `cover_url`, `is_published`)
SELECT '云烟成雨', '房东的猫 · 华语 / 民谣 · 很适合黄昏时分的回望。', '/inspiration/3.webp', true
WHERE NOT EXISTS (SELECT 1 FROM `playlist` WHERE `title` = '云烟成雨');
--> statement-breakpoint
INSERT INTO `booklist` (`title`, `summary`, `cover_url`, `is_published`)
SELECT '明朝那些事儿', '当年明月 · 中国 / 历史 · 把宏大历史读成一个个鲜活的人。', '/inspiration/3.2.webp', true
WHERE NOT EXISTS (SELECT 1 FROM `booklist` WHERE `title` = '明朝那些事儿');
--> statement-breakpoint
INSERT INTO `booklist` (`title`, `summary`, `cover_url`, `is_published`)
SELECT '纳瓦尔宝典', '埃里克·乔根森 · 美国 / 成长 · 关于财富、判断力和幸福的短章。', '/inspiration/3.2.webp', true
WHERE NOT EXISTS (SELECT 1 FROM `booklist` WHERE `title` = '纳瓦尔宝典');
--> statement-breakpoint
INSERT INTO `booklist` (`title`, `summary`, `cover_url`, `is_published`)
SELECT '苏东坡传', '林语堂 · 中国 / 历史 · 看一个人如何把困顿活成旷达。', '/inspiration/3.2.webp', true
WHERE NOT EXISTS (SELECT 1 FROM `booklist` WHERE `title` = '苏东坡传');
--> statement-breakpoint
INSERT INTO `booklist` (`title`, `summary`, `cover_url`, `is_published`)
SELECT '被讨厌的勇气', '岸见一郎 / 古贺史健 · 日本 / 心理 · 把人生的方向交还给自己。', '/inspiration/3.2.webp', true
WHERE NOT EXISTS (SELECT 1 FROM `booklist` WHERE `title` = '被讨厌的勇气');
--> statement-breakpoint
INSERT INTO `booklist` (`title`, `summary`, `cover_url`, `is_published`)
SELECT '小狗钱钱', '博多·舍费尔 · 德国 / 成长 · 轻盈易读的金钱启蒙。', '/inspiration/3.2.webp', true
WHERE NOT EXISTS (SELECT 1 FROM `booklist` WHERE `title` = '小狗钱钱');
--> statement-breakpoint
INSERT INTO `booklist` (`title`, `summary`, `cover_url`, `is_published`)
SELECT '理想国', '柏拉图 · 古希腊 / 哲思 · 从一场对话开始，追问何为正义。', '/inspiration/3.2.webp', true
WHERE NOT EXISTS (SELECT 1 FROM `booklist` WHERE `title` = '理想国');
--> statement-breakpoint
INSERT INTO `booklist` (`title`, `summary`, `cover_url`, `is_published`)
SELECT '非暴力沟通', '马歇尔·卢森堡 · 美国 / 成长 · 听见感受，也听见真正的需要。', '/inspiration/3.2.webp', true
WHERE NOT EXISTS (SELECT 1 FROM `booklist` WHERE `title` = '非暴力沟通');
--> statement-breakpoint
INSERT INTO `booklist` (`title`, `summary`, `cover_url`, `is_published`)
SELECT '局外人', '阿尔贝·加缪 · 法国 / 文学 · 冷静、克制，却有锋利的余温。', '/inspiration/3.2.webp', true
WHERE NOT EXISTS (SELECT 1 FROM `booklist` WHERE `title` = '局外人');
--> statement-breakpoint
INSERT INTO `booklist` (`title`, `summary`, `cover_url`, `is_published`)
SELECT '人生的智慧', '叔本华 · 德国 / 哲思 · 独处时翻开的清醒小册。', '/inspiration/3.2.webp', true
WHERE NOT EXISTS (SELECT 1 FROM `booklist` WHERE `title` = '人生的智慧');
--> statement-breakpoint
INSERT INTO `booklist` (`title`, `summary`, `cover_url`, `is_published`)
SELECT '林徽因传', '张清平 · 中国 / 人物 · 诗意之外，也看见真实的选择。', '/inspiration/3.2.webp', true
WHERE NOT EXISTS (SELECT 1 FROM `booklist` WHERE `title` = '林徽因传');
