SET NAMES utf8mb4;
--> statement-breakpoint
ALTER TABLE `booklist` RENAME COLUMN `title` TO `book_name`;
--> statement-breakpoint
ALTER TABLE `playlist` RENAME COLUMN `title` TO `song_name`;
--> statement-breakpoint
ALTER TABLE `booklist`
  ADD `author` varchar(255) NULL,
  ADD `category` varchar(128) NULL,
  ADD `country` varchar(128) NULL;
--> statement-breakpoint
ALTER TABLE `playlist`
  ADD `artist` varchar(255) NULL,
  ADD `language` varchar(64) NULL,
  ADD `style` enum('流行','古风','抒情','民谣','中国风','其他') NULL;
--> statement-breakpoint
UPDATE `playlist`
SET
  `artist` = CASE `song_name`
    WHEN '七里香' THEN '周杰伦'
    WHEN '如愿' THEN '王菲'
    WHEN '烟雨行舟' THEN '司南'
    WHEN '慢慢喜欢你' THEN '莫文蔚'
    WHEN '旅行的意义' THEN '陈绮贞'
    WHEN '棠梨煎雪' THEN '银临'
    WHEN '听海' THEN '张惠妹'
    WHEN '遇见' THEN '孙燕姿'
    WHEN '小幸运' THEN '田馥甄'
    WHEN '奇妙能力歌' THEN '陈粒'
    WHEN '青花瓷' THEN '周杰伦'
    WHEN '云烟成雨' THEN '房东的猫'
    ELSE '未知歌手'
  END,
  `language` = '华语',
  `style` = CASE `song_name`
    WHEN '七里香' THEN '流行'
    WHEN '如愿' THEN '抒情'
    WHEN '烟雨行舟' THEN '古风'
    WHEN '慢慢喜欢你' THEN '抒情'
    WHEN '旅行的意义' THEN '民谣'
    WHEN '棠梨煎雪' THEN '古风'
    WHEN '听海' THEN '抒情'
    WHEN '遇见' THEN '流行'
    WHEN '小幸运' THEN '流行'
    WHEN '奇妙能力歌' THEN '民谣'
    WHEN '青花瓷' THEN '中国风'
    WHEN '云烟成雨' THEN '民谣'
    ELSE '其他'
  END,
  `summary` = CASE `song_name`
    WHEN '七里香' THEN '适合风从窗棂穿过的下午。'
    WHEN '如愿' THEN '把漫长的心愿唱得很轻。'
    WHEN '烟雨行舟' THEN '雨落江南，舟行有声。'
    WHEN '慢慢喜欢你' THEN '适合给日子留一点余地。'
    WHEN '旅行的意义' THEN '一首适合整理行囊的歌。'
    WHEN '棠梨煎雪' THEN '春色落在一盏温茶里。'
    WHEN '听海' THEN '留给不想急着说话的夜晚。'
    WHEN '遇见' THEN '那些恰好发生的相逢。'
    WHEN '小幸运' THEN '明亮、轻快，适合重新出发。'
    WHEN '奇妙能力歌' THEN '把微小的情绪唱出形状。'
    WHEN '青花瓷' THEN '留一页给雨声和旧窗。'
    WHEN '云烟成雨' THEN '很适合黄昏时分的回望。'
    ELSE `summary`
  END;
--> statement-breakpoint
UPDATE `booklist`
SET
  `author` = CASE `book_name`
    WHEN '明朝那些事儿' THEN '当年明月'
    WHEN '纳瓦尔宝典' THEN '埃里克·乔根森'
    WHEN '苏东坡传' THEN '林语堂'
    WHEN '被讨厌的勇气' THEN '岸见一郎 / 古贺史健'
    WHEN '小狗钱钱' THEN '博多·舍费尔'
    WHEN '理想国' THEN '柏拉图'
    WHEN '非暴力沟通' THEN '马歇尔·卢森堡'
    WHEN '局外人' THEN '阿尔贝·加缪'
    WHEN '人生的智慧' THEN '叔本华'
    WHEN '林徽因传' THEN '张清平'
    ELSE '未知作者'
  END,
  `category` = CASE `book_name`
    WHEN '明朝那些事儿' THEN '历史'
    WHEN '纳瓦尔宝典' THEN '成长'
    WHEN '苏东坡传' THEN '历史'
    WHEN '被讨厌的勇气' THEN '心理'
    WHEN '小狗钱钱' THEN '成长'
    WHEN '理想国' THEN '哲思'
    WHEN '非暴力沟通' THEN '成长'
    WHEN '局外人' THEN '文学'
    WHEN '人生的智慧' THEN '哲思'
    WHEN '林徽因传' THEN '人物'
    ELSE '其他'
  END,
  `country` = CASE `book_name`
    WHEN '明朝那些事儿' THEN '中国'
    WHEN '纳瓦尔宝典' THEN '美国'
    WHEN '苏东坡传' THEN '中国'
    WHEN '被讨厌的勇气' THEN '日本'
    WHEN '小狗钱钱' THEN '德国'
    WHEN '理想国' THEN '古希腊'
    WHEN '非暴力沟通' THEN '美国'
    WHEN '局外人' THEN '法国'
    WHEN '人生的智慧' THEN '德国'
    WHEN '林徽因传' THEN '中国'
    ELSE '未知'
  END,
  `summary` = CASE `book_name`
    WHEN '明朝那些事儿' THEN '把宏大历史读成一个个鲜活的人。'
    WHEN '纳瓦尔宝典' THEN '关于财富、判断力和幸福的短章。'
    WHEN '苏东坡传' THEN '看一个人如何把困顿活成旷达。'
    WHEN '被讨厌的勇气' THEN '把人生的方向交还给自己。'
    WHEN '小狗钱钱' THEN '轻盈易读的金钱启蒙。'
    WHEN '理想国' THEN '从一场对话开始，追问何为正义。'
    WHEN '非暴力沟通' THEN '听见感受，也听见真正的需要。'
    WHEN '局外人' THEN '冷静、克制，却有锋利的余温。'
    WHEN '人生的智慧' THEN '独处时翻开的清醒小册。'
    WHEN '林徽因传' THEN '诗意之外，也看见真实的选择。'
    ELSE `summary`
  END;
--> statement-breakpoint
ALTER TABLE `playlist`
  COMMENT = '歌单内容',
  MODIFY COLUMN `song_name` varchar(255) NOT NULL COMMENT '歌曲名称',
  MODIFY COLUMN `artist` varchar(255) NOT NULL COMMENT '歌手',
  MODIFY COLUMN `language` varchar(64) NOT NULL COMMENT '歌曲语言',
  MODIFY COLUMN `style` enum('流行','古风','抒情','民谣','中国风','其他') NOT NULL COMMENT '歌曲风格',
  MODIFY COLUMN `summary` text COMMENT '歌曲简介',
  MODIFY COLUMN `cover_url` text COMMENT '封面地址',
  MODIFY COLUMN `is_published` boolean NOT NULL DEFAULT false COMMENT '是否公开发布',
  MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT (now()) COMMENT '创建时间';
--> statement-breakpoint
ALTER TABLE `booklist`
  COMMENT = '书单内容',
  MODIFY COLUMN `book_name` varchar(255) NOT NULL COMMENT '书籍名称',
  MODIFY COLUMN `author` varchar(255) NOT NULL COMMENT '作者',
  MODIFY COLUMN `category` varchar(128) NOT NULL COMMENT '书籍类型',
  MODIFY COLUMN `country` varchar(128) NOT NULL COMMENT '所属国家或地区',
  MODIFY COLUMN `summary` text COMMENT '书籍简介',
  MODIFY COLUMN `cover_url` text COMMENT '封面地址',
  MODIFY COLUMN `is_published` boolean NOT NULL DEFAULT false COMMENT '是否公开发布',
  MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT (now()) COMMENT '创建时间';
