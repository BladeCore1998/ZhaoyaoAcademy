export type CuratedSong = {
  title: string;
  artist: string;
  language: string;
  style: string;
  note: string;
};

export type CuratedBook = {
  title: string;
  author: string;
  country: string;
  category: string;
  status: "在读" | "已读" | "未读";
  note: string;
};

export const curatedSongs: CuratedSong[] = [
  { title: "七里香", artist: "周杰伦", language: "华语", style: "流行", note: "适合风从窗棂穿过的下午。" },
  { title: "如愿", artist: "王菲", language: "华语", style: "抒情", note: "把漫长的心愿唱得很轻。" },
  { title: "烟雨行舟", artist: "司南", language: "华语", style: "古风", note: "雨落江南，舟行有声。" },
  { title: "慢慢喜欢你", artist: "莫文蔚", language: "华语", style: "抒情", note: "适合给日子留一点余地。" },
  { title: "旅行的意义", artist: "陈绮贞", language: "华语", style: "民谣", note: "一首适合整理行囊的歌。" },
  { title: "棠梨煎雪", artist: "银临", language: "华语", style: "古风", note: "春色落在一盏温茶里。" },
  { title: "听海", artist: "张惠妹", language: "华语", style: "抒情", note: "留给不想急着说话的夜晚。" },
  { title: "遇见", artist: "孙燕姿", language: "华语", style: "流行", note: "那些恰好发生的相逢。" },
  { title: "小幸运", artist: "田馥甄", language: "华语", style: "流行", note: "明亮、轻快，适合重新出发。" },
  { title: "奇妙能力歌", artist: "陈粒", language: "华语", style: "民谣", note: "把微小的情绪唱出形状。" },
  { title: "青花瓷", artist: "周杰伦", language: "华语", style: "中国风", note: "留一页给雨声和旧窗。" },
  { title: "云烟成雨", artist: "房东的猫", language: "华语", style: "民谣", note: "很适合黄昏时分的回望。" },
];

export const curatedBooks: CuratedBook[] = [
  { title: "明朝那些事儿", author: "当年明月", country: "中国", category: "历史", status: "在读", note: "把宏大历史读成一个个鲜活的人。" },
  { title: "纳瓦尔宝典", author: "埃里克·乔根森", country: "美国", category: "成长", status: "在读", note: "关于财富、判断力和幸福的短章。" },
  { title: "苏东坡传", author: "林语堂", country: "中国", category: "历史", status: "已读", note: "看一个人如何把困顿活成旷达。" },
  { title: "被讨厌的勇气", author: "岸见一郎 / 古贺史健", country: "日本", category: "心理", status: "已读", note: "把人生的方向交还给自己。" },
  { title: "小狗钱钱", author: "博多·舍费尔", country: "德国", category: "成长", status: "未读", note: "轻盈易读的金钱启蒙。" },
  { title: "理想国", author: "柏拉图", country: "古希腊", category: "哲思", status: "未读", note: "从一场对话开始，追问何为正义。" },
  { title: "非暴力沟通", author: "马歇尔·卢森堡", country: "美国", category: "成长", status: "未读", note: "听见感受，也听见真正的需要。" },
  { title: "局外人", author: "阿尔贝·加缪", country: "法国", category: "文学", status: "未读", note: "冷静、克制，却有锋利的余温。" },
  { title: "人生的智慧", author: "叔本华", country: "德国", category: "哲思", status: "未读", note: "独处时翻开的清醒小册。" },
  { title: "林徽因传", author: "张清平", country: "中国", category: "人物", status: "未读", note: "诗意之外，也看见真实的选择。" },
];

export const materialNotes = [
  { label: "今日适合", value: "听一首抒情歌，再读十页书。" },
  { label: "本周关键词", value: "慢下来，重新感受。" },
  { label: "院里天气", value: "有风，宜把心事放在窗边。" },
];
