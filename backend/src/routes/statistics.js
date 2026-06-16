const express = require('express');

/**
 * 节日统计路由
 * @param {import('sql.js').Database} db
 */
function createStatisticsRouter(db) {
  const router = express.Router();

  /**
   * 按地区汇总节日数量，按数量降序排列
   */
  router.get('/by-region', (_req, res) => {
    const rows = db
      .prepare(
        `SELECT region, COUNT(*) AS count
         FROM festivals
         GROUP BY region
         ORDER BY count DESC, region ASC`
      )
      .all();

    const total = rows.reduce((sum, row) => sum + row.count, 0);

    res.json({
      total,
      regions: rows,
    });
  });

  return router;
}

module.exports = { createStatisticsRouter };
