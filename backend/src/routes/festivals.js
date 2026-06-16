const express = require('express');

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
   * 获取节日列表，支持地区筛选
   */
  router.get('/', (req, res) => {
    const { region } = req.query;

    if (region) {
      const rows = db
        .prepare(
          'SELECT * FROM festivals WHERE region = ? ORDER BY id ASC'
        )
        .all(region);
      return res.json(rows);
    }

    const rows = db
      .prepare('SELECT * FROM festivals ORDER BY id ASC')
      .all();
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

    res.json(row);
  });

  /**
   * 新增节日
   */
  router.post('/', (req, res) => {
    const { name, region, date_description, custom_summary, source } = req.body;

    if (!name || !region || !date_description || !custom_summary || !source) {
      return res.status(400).json({ message: '请填写全部字段' });
    }

    const result = db
      .prepare(
        `INSERT INTO festivals (name, region, date_description, custom_summary, source)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(name, region, date_description, custom_summary, source);

    const created = db
      .prepare('SELECT * FROM festivals WHERE id = ?')
      .get(result.lastInsertRowid);

    res.status(201).json(created);
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

    const { name, region, date_description, custom_summary, source } = req.body;

    if (!name || !region || !date_description || !custom_summary || !source) {
      return res.status(400).json({ message: '请填写全部字段' });
    }

    db.prepare(
      `UPDATE festivals
       SET name = ?, region = ?, date_description = ?, custom_summary = ?, source = ?,
           updated_at = datetime('now', 'localtime')
       WHERE id = ?`
    ).run(name, region, date_description, custom_summary, source, id);

    const updated = db.prepare('SELECT * FROM festivals WHERE id = ?').get(id);
    res.json(updated);
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
