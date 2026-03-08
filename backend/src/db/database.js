/**
 * SQLite database using sql.js (pure JavaScript - no native build tools needed).
 * Persists to data/billing.db so it works on Windows without Visual Studio.
 */
const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', '..', 'data', 'billing.db');
const dataDir = path.dirname(dbPath);

let db = null;

function rowsToObjects(columns, values) {
  if (!values || values.length === 0) return [];
  return values.map((row) => {
    const obj = {};
    columns.forEach((col, i) => { obj[col] = row[i]; });
    return obj;
  });
}

function createDbWrapper(nativeDb) {
  const save = () => {
    try {
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
      fs.writeFileSync(dbPath, Buffer.from(nativeDb.export()));
    } catch (e) {
      console.error('Could not save database:', e.message);
    }
  };

  return {
    _native: nativeDb,
    save,

    exec(sql) {
      nativeDb.run('BEGIN');
      try {
        const result = nativeDb.exec(sql);
        nativeDb.run('COMMIT');
        return result;
      } catch (e) {
        nativeDb.run('ROLLBACK');
        throw e;
      }
    },

    prepare(sql) {
      return {
        get(...params) {
          const stmt = nativeDb.prepare(sql);
          stmt.bind(params);
          const row = stmt.step() ? stmt.getAsObject() : null;
          stmt.free();
          return row;
        },
        all(...params) {
          const stmt = nativeDb.prepare(sql);
          stmt.bind(params);
          const rows = [];
          while (stmt.step()) rows.push(stmt.getAsObject());
          stmt.free();
          return rows;
        },
        run(...params) {
          nativeDb.run(sql, params);
          const r = nativeDb.exec('SELECT last_insert_rowid() as id');
          const id = r[0] && r[0].values[0] ? r[0].values[0][0] : 0;
          save();
          return { lastInsertRowid: id };
        },
      };
    },

    transaction(fn) {
      nativeDb.run('BEGIN');
      try {
        const result = fn();
        nativeDb.run('COMMIT');
        save();
        return result;
      } catch (e) {
        nativeDb.run('ROLLBACK');
        throw e;
      }
    },
  };
}

/**
 * Create tables if they don't exist
 */
function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      barcode TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      weight_grams REAL DEFAULT 0,
      image_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT UNIQUE NOT NULL,
      user_id INTEGER,
      total_amount REAL NOT NULL,
      payment_mode TEXT NOT NULL,
      payment_status TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      barcode TEXT NOT NULL,
      product_name TEXT NOT NULL,
      price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      subtotal REAL NOT NULL,
      weight_grams REAL DEFAULT 0,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);
  db.save();
  // Ensure demo user exists for login (admin / admin123)
  try {
    db.prepare('INSERT OR IGNORE INTO users (id, username, password_hash) VALUES (1, ?, ?)').run('admin', 'admin123');
    db.save();
  } catch (e) { /* already exists */ }
  console.log('Database initialized.');
}

function generateOrderId() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const count = db.prepare('SELECT COUNT(*) as c FROM orders').get();
  const seq = String((count.c || 0) + 1).padStart(4, '0');
  return `ORD-${date}-${seq}`;
}

async function init() {
  if (db) return db;
  const SQL = await initSqlJs();
  if (fs.existsSync(dbPath)) {
    const buf = fs.readFileSync(dbPath);
    db = createDbWrapper(new SQL.Database(buf));
  } else {
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    db = createDbWrapper(new SQL.Database());
  }
  initDatabase();
  return db;
}

// Sync init for use in routes (we'll call init() from index.js first)
let initPromise = null;
function getDb() {
  if (!db) throw new Error('Database not initialized. Call await init() in index.js first.');
  return db;
}

module.exports = {
  get db() {
    return getDb();
  },
  initDatabase,
  generateOrderId,
  init,
};