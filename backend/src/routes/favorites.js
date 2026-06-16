const express = require('express');

function createFavoriteRouter(db) {
  const router = express.Router();

  router.get('/', (_req, res) => {
    const rows = db
      .prepare(
        `SELECT f.id AS favorite_id, f.created_at AS favorited_at,
                fe.id, fe.name, fe.region, fe.custom_summary, fe.date_description
         FROM favorites f
         JOIN festivals fe ON f.festival_id = fe.id
         ORDER BY f.created_at DESC`
      )
      .all();
    res.json(rows);
  });

  router.post('/', (req, res) => {
    const { festival_id } = req.body;

    if (!festival_id) {
      return res.status(400).json({ message: '缺少 festival_id' });
    }

    const festival = db
      .prepare('SELECT id FROM festivals WHERE id = ?')
      .get(festival_id);
    if (!festival) {
      return res.status(404).json({ message: '节日不存在' });
    }

    const existing = db
      .prepare('SELECT id FROM favorites WHERE festival_id = ?')
      .get(festival_id);
    if (existing) {
      return res.status(409).json({ message: '已收藏该节日' });
    }

    db.prepare('INSERT INTO favorites (festival_id) VALUES (?)').run(festival_id);

    const row = db
      .prepare(
        `SELECT f.id AS favorite_id, f.created_at AS favorited_at,
                fe.id, fe.name, fe.region, fe.custom_summary, fe.date_description
         FROM favorites f
         JOIN festivals fe ON f.festival_id = fe.id
         WHERE f.festival_id = ?`
      )
      .get(festival_id);

    res.status(201).json(row);
  });

  router.delete('/:festivalId', (req, res) => {
    const festivalId = Number(req.params.festivalId);
    const result = db
      .prepare('DELETE FROM favorites WHERE festival_id = ?')
      .run(festivalId);

    if (result.changes === 0) {
      return res.status(404).json({ message: '未收藏该节日' });
    }

    res.status(204).send();
  });

  router.get('/check/:festivalId', (req, res) => {
    const festivalId = Number(req.params.festivalId);
    const row = db
      .prepare('SELECT id FROM favorites WHERE festival_id = ?')
      .get(festivalId);
    res.json({ favorited: Boolean(row) });
  });

  return router;
}

module.exports = { createFavoriteRouter };
