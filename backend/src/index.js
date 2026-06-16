const express = require('express');
const cors = require('cors');
const { initDb } = require('./db');
const { seedFestivals } = require('./seed');
const { createFestivalRouter } = require('./routes/festivals');

const PORT = 8000;

/**
 * 启动 Express 服务
 */
async function bootstrap() {
  const db = await initDb();
  seedFestivals(db);

  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/festivals', createFestivalRouter(db));

  app.listen(PORT, () => {
    console.log(`后端服务已启动: http://localhost:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('后端启动失败:', err);
  process.exit(1);
});
