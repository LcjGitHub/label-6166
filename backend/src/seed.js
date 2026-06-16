/**
 * 初始化示例节日数据
 * @param {import('./db').DbWrapper} db
 */
function seedFestivals(db) {
  const count = db.prepare('SELECT COUNT(*) AS total FROM festivals').get().total;
  if (count > 0) {
    return;
  }

  const insert = db.prepare(`
    INSERT INTO festivals (name, region, date_description, custom_summary, source, tags)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const festivals = [
    [
      '泼水节',
      '云南',
      '农历新年（傣历）后第三、四天，公历约 4 月中旬',
      '人们互相泼水祈福，举行龙舟竞渡、放高升、跳孔雀舞，象征洗去旧岁不顺、迎接吉祥。',
      '《傣族节日志》、西双版纳州文旅资料',
      JSON.stringify(['民族节日', '泼水祈福', '传统庆典']),
    ],
    [
      '那达慕大会',
      '内蒙古',
      '农历六月初四起，为期三至五日',
      '以摔跤、赛马、射箭“男儿三艺”为核心，兼有歌舞、祭敖包，展现草原游牧文化。',
      '《蒙古族风俗志》、内蒙古自治区非遗名录',
      JSON.stringify(['民族节日', '体育竞技', '传统庆典']),
    ],
    [
      '三月三',
      '广西',
      '农历三月初三',
      '壮族对歌、抛绣球、抢花炮，青年男女以歌传情，亦有五色糯米饭等饮食习俗。',
      '《壮族民间节日》、广西民族研究所资料',
      JSON.stringify(['民族节日', '饮食习俗', '对歌传情']),
    ],
    [
      '妈祖诞辰',
      '福建',
      '农历三月二十三',
      '沿海信众祭妈祖、绕境巡安、抬轿祈福，祈求海上平安与风调雨顺。',
      '《湄洲妈祖志》、福建沿海民间信仰调查',
      JSON.stringify(['宗教祭祀', '民间信仰', '传统庆典']),
    ],
    [
      '社火',
      '陕西',
      '正月十五前后，部分村落延至二月初二',
      '高跷、秧歌、芯子、锣鼓等街头巡游表演，寓意驱邪纳福、社区团聚。',
      '《陕西民间艺术概览》、关中民俗田野记录',
      JSON.stringify(['传统庆典', '民间表演', '驱邪纳福']),
    ],
  ];

  for (const item of festivals) {
    insert.run(...item);
  }
  console.log(`已写入 ${festivals.length} 条节日 seed 数据`);
}

module.exports = { seedFestivals };
