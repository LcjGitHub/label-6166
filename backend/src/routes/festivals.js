const express = require('express');

const LUNAR_MONTH_MAP = {
  '正': 1, '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
  '六': 6, '七': 7, '八': 8, '九': 9, '十': 10, '腊': 12,
};

function parseMonthFromDescription(desc) {
  if (!desc) return null;

  const solarMonthMatch = desc.match(/公历(?:约\s*)?(\d{1,2})\s*月/);
  if (solarMonthMatch) return Number(solarMonthMatch[1]);

  const arabicMonthMatch = desc.match(/(\d{1,2})\s*月/);
  if (arabicMonthMatch) return Number(arabicMonthMatch[1]);

  const lunarMonthMatch = desc.match(/(?:农历\s*)?(?:十[一二]|[一二三四五六七八九十腊正])月/);
  if (lunarMonthMatch) {
    const raw = lunarMonthMatch[0].replace(/农历\s*/, '').replace('月', '');
    if (raw === '十一') return 11;
    if (raw === '十二') return 12;
    if (LUNAR_MONTH_MAP[raw]) return LUNAR_MONTH_MAP[raw];
  }

  const lunarDayMatch = desc.match(/[一二三四五六七八九十]+月初[一二三四五六七八九十]+/);
  if (lunarDayMatch) {
    const monthPart = lunarDayMatch[0].split('月')[0];
    if (monthPart === '十一') return 11;
    if (monthPart === '十二') return 12;
    if (LUNAR_MONTH_MAP[monthPart]) return LUNAR_MONTH_MAP[monthPart];
  }

  if (/正月/.test(desc)) return 1;
  if (/腊月/.test(desc)) return 12;

  return null;
}

function parseDayFromDescription(desc) {
  if (!desc) return null;

  const chineseToNum = {
    '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
    '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
    '十一': 11, '十二': 12, '十三': 13, '十四': 14, '十五': 15,
    '十六': 16, '十七': 17, '十八': 18, '十九': 19, '二十': 20,
    '二十一': 21, '二十二': 22, '二十三': 23, '二十四': 24, '二十五': 25,
    '二十六': 26, '二十七': 27, '二十八': 28, '二十九': 29, '三十': 30,
  };

  const dayPatterns = [
    /月(二十[一二三四五六七八九十]|[一二三四五六七八九十]{2,}|十[一二三四五六七八九])/,
    /初([一二三四五六七八九十]+)/,
    /([一二三四五六七八九十]+)日/,
  ];

  for (const pattern of dayPatterns) {
    const match = desc.match(pattern);
    if (match && chineseToNum[match[1]]) {
      return chineseToNum[match[1]];
    }
  }

  return null;
}

function parseTags(row) {
  if (row && row.tags) {
    try {
      row.tags = JSON.parse(row.tags);
    } catch (e) {
      row.tags = [];
    }
  }
  return row;
}

/**
 * 节日 CRUD 路由
 * @param {import('better-sqlite3').Database} db
 */
function createFestivalRouter(db) {
  const router = express.Router();

  router.get('/by-month', (req, res) => {
    const month = Number(req.query.month);
    if (!month || month < 1 || month > 12) {
      return res.status(400).json({ message: '请提供有效的月份参数 (1-12)' });
    }

    const rows = db.prepare('SELECT * FROM festivals').all().map(parseTags);
    const matched = rows.filter((row) => {
      const parsed = parseMonthFromDescription(row.date_description);
      return parsed === month;
    }).map((row) => ({
      ...row,
      parsed_month: parseMonthFromDescription(row.date_description),
      parsed_day: parseDayFromDescription(row.date_description),
    }));

    res.json(matched);
  });

  /**
   * 获取地区列表（用于筛选）
   */
  router.get('/regions', (_req, res) => {
    const rows = db
      .prepare('SELECT DISTINCT region FROM festivals ORDER BY region ASC')
      .all();
    res.json(rows.map((row) => row.region));
  });

  /**
   * 获取标签列表（用于筛选）
   */
  router.get('/tags', (_req, res) => {
    const rows = db
      .prepare('SELECT tags FROM festivals WHERE tags IS NOT NULL AND tags != \'[]\'')
      .all();
    const tagSet = new Set();
    for (const row of rows) {
      try {
        const tags = JSON.parse(row.tags);
        for (const tag of tags) {
          tagSet.add(tag);
        }
      } catch (e) {
        // 忽略解析错误
      }
    }
    const tagList = Array.from(tagSet).sort();
    res.json(tagList);
  });

  /**
   * 获取节日列表，支持地区和标签筛选
   */
  router.get('/', (req, res) => {
    const { region, tag, keyword } = req.query;

    let sql = 'SELECT * FROM festivals WHERE 1=1';
    const params = [];

    if (region) {
      sql += ' AND region = ?';
      params.push(region);
    }

    if (keyword) {
      sql += ' AND (name LIKE ? OR custom_summary LIKE ?)';
      const like = `%${keyword}%`;
      params.push(like, like);
    }

    sql += ' ORDER BY id ASC';

    let rows = db.prepare(sql).all(...params).map(parseTags);

    if (tag) {
      rows = rows.filter((row) => {
        return Array.isArray(row.tags) && row.tags.includes(tag);
      });
    }

    res.json(rows);
  });

  /**
   * 获取单个节日详情
   */
  router.get('/:id', (req, res) => {
    const row = db
      .prepare('SELECT * FROM festivals WHERE id = ?')
      .get(Number(req.params.id));

    if (!row) {
      return res.status(404).json({ message: '节日不存在' });
    }

    res.json(parseTags(row));
  });

  /**
   * 新增节日
   */
  router.post('/', (req, res) => {
    const { name, region, date_description, custom_summary, source, tags = [] } = req.body;

    if (!name || !region || !date_description || !custom_summary || !source) {
      return res.status(400).json({ message: '请填写全部字段' });
    }

    const tagsJson = JSON.stringify(Array.isArray(tags) ? tags : []);

    const result = db
      .prepare(
        `INSERT INTO festivals (name, region, date_description, custom_summary, source, tags)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(name, region, date_description, custom_summary, source, tagsJson);

    const created = db
      .prepare('SELECT * FROM festivals WHERE id = ?')
      .get(result.lastInsertRowid);

    res.status(201).json(parseTags(created));
  });

  /**
   * 更新节日
   */
  router.put('/:id', (req, res) => {
    const id = Number(req.params.id);
    const existing = db.prepare('SELECT id FROM festivals WHERE id = ?').get(id);

    if (!existing) {
      return res.status(404).json({ message: '节日不存在' });
    }

    const { name, region, date_description, custom_summary, source, tags = [] } = req.body;

    if (!name || !region || !date_description || !custom_summary || !source) {
      return res.status(400).json({ message: '请填写全部字段' });
    }

    const tagsJson = JSON.stringify(Array.isArray(tags) ? tags : []);

    db.prepare(
      `UPDATE festivals
       SET name = ?, region = ?, date_description = ?, custom_summary = ?, source = ?,
           tags = ?, updated_at = datetime('now', 'localtime')
       WHERE id = ?`
    ).run(name, region, date_description, custom_summary, source, tagsJson, id);

    const updated = db.prepare('SELECT * FROM festivals WHERE id = ?').get(id);
    res.json(parseTags(updated));
  });

  /**
   * 删除节日
   */
  router.delete('/:id', (req, res) => {
    const id = Number(req.params.id);
    const result = db.prepare('DELETE FROM festivals WHERE id = ?').run(id);

    if (result.changes === 0) {
      return res.status(404).json({ message: '节日不存在' });
    }

    res.status(204).send();
  });

  return router;
}

module.exports = { createFestivalRouter };
