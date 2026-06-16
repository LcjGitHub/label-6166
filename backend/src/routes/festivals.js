const express = require('express');

const LUNAR_MONTH_MAP = {
  '正': 1, '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
  '六': 6, '七': 7, '八': 8, '九': 9, '十': 10, '腊': 12,
};

const CHINESE_TO_NUM = {
  '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
  '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
  '十一': 11, '十二': 12, '十三': 13, '十四': 14, '十五': 15,
  '十六': 16, '十七': 17, '十八': 18, '十九': 19, '二十': 20,
  '二十一': 21, '二十二': 22, '二十三': 23, '二十四': 24, '二十五': 25,
  '二十六': 26, '二十七': 27, '二十八': 28, '二十九': 29, '三十': 30,
};

function parseLunarMonth(raw) {
  if (raw === '十一') return 11;
  if (raw === '十二') return 12;
  if (LUNAR_MONTH_MAP[raw]) return LUNAR_MONTH_MAP[raw];
  return null;
}

function parseChineseNum(raw) {
  return CHINESE_TO_NUM[raw] || null;
}

function parseDateInfo(desc) {
  if (!desc) return null;

  const result = {
    months: [],
    day: null,
    dateType: 'unknown',
    hasExactDay: false,
  };

  const solarExactMatch = desc.match(/公历(?:约\s*)?(\d{1,2})\s*月(?:(\d{1,2})\s*日)?/);
  if (solarExactMatch) {
    result.months.push(Number(solarExactMatch[1]));
    result.dateType = 'solar';
    if (solarExactMatch[2]) {
      result.day = Number(solarExactMatch[2]);
      result.hasExactDay = true;
    }
    return result;
  }

  const solarMonthMatch = desc.match(/(\d{1,2})\s*月/);
  if (solarMonthMatch && !/农历|正月|腊月|[一二三四五六七八九十]月/.test(desc)) {
    result.months.push(Number(solarMonthMatch[1]));
    result.dateType = 'solar';
    return result;
  }

  const lunarDates = [];
  const lunarPattern = /([正一二三四五六七八九十腊]+)月(?:初([一二三四五六七八九十]+)|([一二三四五六七八九十]{2,}))?/g;
  let match;
  while ((match = lunarPattern.exec(desc)) !== null) {
    const monthStr = match[1];
    const dayStr = match[2] || match[3];
    const month = parseLunarMonth(monthStr);
    if (month) {
      const day = dayStr ? parseChineseNum(dayStr) : null;
      lunarDates.push({ month, day });
      if (!result.months.includes(month)) {
        result.months.push(month);
      }
    }
  }

  if (/正月/.test(desc) && !result.months.includes(1)) {
    result.months.push(1);
  }
  if (/腊月/.test(desc) && !result.months.includes(12)) {
    result.months.push(12);
  }

  if (lunarDates.length > 0) {
    result.dateType = 'lunar';
    const firstWithDay = lunarDates.find(d => d.day !== null);
    if (firstWithDay) {
      result.day = firstWithDay.day;
      result.hasExactDay = true;
    }
  }

  if (result.months.length === 0) {
    return null;
  }

  return result;
}

function parseMonthFromDescription(desc) {
  const info = parseDateInfo(desc);
  return info && info.months.length > 0 ? info.months[0] : null;
}

function parseDayFromDescription(desc) {
  const info = parseDateInfo(desc);
  return info ? info.day : null;
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
      const parsed = parseDateInfo(row.date_description);
      return parsed && parsed.months.includes(month);
    }).map((row) => {
      const parsed = parseDateInfo(row.date_description);
      let displayDay = null;
      let dateNote = '';

      const lunarPattern = /([正一二三四五六七八九十腊]+)月(?:初([一二三四五六七八九十]+)|([一二三四五六七八九十]{2,}))?/g;
      let lunarMatch;
      let monthDay = null;
      while ((lunarMatch = lunarPattern.exec(row.date_description)) !== null) {
        const m = parseLunarMonth(lunarMatch[1]);
        if (m === month) {
          const dayStr = lunarMatch[2] || lunarMatch[3];
          monthDay = dayStr ? parseChineseNum(dayStr) : null;
          break;
        }
      }

      if (parsed.dateType === 'lunar') {
        const dayForNote = monthDay || parsed.day;
        if (dayForNote) {
          displayDay = 15;
          dateNote = `农历${dayForNote}日前后（本月中旬）`;
        } else {
          displayDay = null;
          dateNote = '本月内';
        }
      } else if (parsed.dateType === 'solar') {
        if (parsed.hasExactDay) {
          displayDay = parsed.day;
        } else if (/中旬/.test(row.date_description)) {
          displayDay = 15;
          dateNote = '本月中旬';
        } else if (/上旬/.test(row.date_description)) {
          displayDay = 5;
          dateNote = '本月上旬';
        } else if (/下旬/.test(row.date_description)) {
          displayDay = 25;
          dateNote = '本月下旬';
        } else {
          displayDay = null;
          dateNote = '本月内';
        }
      }

      return {
        ...row,
        parsed_month: month,
        parsed_day: displayDay,
        date_type: parsed.dateType,
        has_exact_day: parsed.hasExactDay,
        date_note: dateNote,
        all_months: parsed.months,
      };
    });

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
   * 获取节日列表，支持地区、标签筛选和分页
   */
  router.get('/', (req, res) => {
    const { region, tag, keyword, page = 1, pageSize = 10 } = req.query;

    const pageNum = Math.max(1, Number(page) || 1);
    const size = Math.max(1, Math.min(100, Number(pageSize) || 10));

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

    const total = rows.length;
    const offset = (pageNum - 1) * size;
    const data = rows.slice(offset, offset + size);

    res.json({
      total,
      data,
      page: pageNum,
      pageSize: size,
    });
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
