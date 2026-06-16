const express = require('express');

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
