const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'festival.db');

/**
 * 确保数据目录存在
 */
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * 将数据库持久化到磁盘
 * @param {import('sql.js').Database} db
 */
function persistDb(db) {
  ensureDataDir();
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

/**
 * @typedef {object} RunResult
 * @property {number} lastInsertRowid
 * @property {number} changes
 */

/**
 * 封装 sql.js 语句，提供类似 better-sqlite3 的 API
 */
class Statement {
  /**
   * @param {import('sql.js').Database} db
   * @param {string} sql
   * @param {() => void} onMutate
   */
  constructor(db, sql, onMutate) {
    this.db = db;
    this.sql = sql;
    this.onMutate = onMutate;
  }

  /**
   * 查询多行
   * @param {...*} params
   * @returns {Record<string, unknown>[]}
   */
  all(...params) {
    const stmt = this.db.prepare(this.sql);
    if (params.length) {
      stmt.bind(params);
    }
    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
  }

  /**
   * 查询单行
   * @param {...*} params
   * @returns {Record<string, unknown>|undefined}
   */
  get(...params) {
    return this.all(...params)[0];
  }

  /**
   * 执行写操作
   * @param {...*} params
   * @returns {RunResult}
   */
  run(...params) {
    this.db.run(this.sql, params);
    const lastInsertRowid =
      this.db.exec('SELECT last_insert_rowid() AS id')[0]?.values[0][0] ?? 0;
    const changes = this.db.getRowsModified();
    this.onMutate();
    return { lastInsertRowid, changes };
  }
}

/**
 * 数据库访问封装
 */
class DbWrapper {
  /**
   * @param {import('sql.js').Database} db
   */
  constructor(db) {
    this.db = db;
  }

  /**
   * 执行 DDL
   * @param {string} sql
   */
  exec(sql) {
    this.db.exec(sql);
    persistDb(this.db);
  }

  /**
   * 预编译语句
   * @param {string} sql
   * @returns {Statement}
   */
  prepare(sql) {
    const isMutating = /^\s*(INSERT|UPDATE|DELETE|REPLACE)/i.test(sql);
    return new Statement(this.db, sql, () => {
      if (isMutating) {
        persistDb(this.db);
      }
    });
  }

  /**
   * 事务执行
   * @param {(items: unknown[]) => void} fn
   * @returns {(items: unknown[]) => void}
   */
  transaction(fn) {
    return (items) => {
      this.db.run('BEGIN');
      try {
        fn(items);
        this.db.run('COMMIT');
        persistDb(this.db);
      } catch (err) {
        this.db.run('ROLLBACK');
        throw err;
      }
    };
  }
}

/**
 * 初始化数据库连接与表结构
 * @returns {Promise<DbWrapper>}
 */
async function initDb() {
  ensureDataDir();
  const SQL = await initSqlJs();

  let db;
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  const wrapper = new DbWrapper(db);

  wrapper.db.exec(`
    CREATE TABLE IF NOT EXISTS festivals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      region TEXT NOT NULL,
      date_description TEXT NOT NULL,
      custom_summary TEXT NOT NULL,
      source TEXT NOT NULL,
      tags TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    )
  `);

  try {
    wrapper.db.exec('ALTER TABLE festivals ADD COLUMN tags TEXT DEFAULT \'[]\'');
  } catch (e) {
    // 列已存在，忽略错误
  }

  wrapper.db.exec(`
    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      festival_id INTEGER NOT NULL UNIQUE,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (festival_id) REFERENCES festivals(id) ON DELETE CASCADE
    )
  `);

  wrapper.db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_favorites_festival_id ON favorites(festival_id)
  `);

  persistDb(db);

  return wrapper;
}

module.exports = { initDb, DB_PATH };
