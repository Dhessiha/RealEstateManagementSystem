// MySQL-backed datastore. Every route talks to the small set
// of functions below, not to the driver directly — so this is the only
// file that knows it's MySQL. `id` is our own app-level string id
// (e.g. "PRJ-AB12CD"), stored as a normal field and used for every
// lookup.
import mysql from "mysql2/promise";

let pool = null;
let initPromise = null;

function parseDbConfig() {
  if (process.env.MYSQL_URI || process.env.DATABASE_URL) {
    const urlStr = process.env.MYSQL_URI || process.env.DATABASE_URL;
    return { uri: urlStr };
  }

  return {
    host: process.env.MYSQL_HOST || "localhost",
    port: Number(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DATABASE || "siteflow",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: process.env.MYSQL_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  };
}

async function createDatabaseIfNotExists(config) {
  if (config.uri) return; // For remote connection URIs (e.g. cloud MySQL), assume DB exists
  const dbName = config.database;
  if (!dbName) return;

  try {
    const tempConn = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      ssl: config.ssl,
    });
    await tempConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await tempConn.end();
  } catch (err) {
    // If user doesn't have privilege to create DB, ignore and let standard pool connect directly
    console.warn("Notice: Checked database creation:", err.message);
  }
}

async function initSchema(p) {
  // 1. Users table for authentication and account management
  await p.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY,
      role VARCHAR(32) NOT NULL DEFAULT 'client',
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) DEFAULT '',
      phone VARCHAR(64) DEFAULT '',
      password VARCHAR(255) NOT NULL,
      title VARCHAR(255) DEFAULT NULL,
      provider VARCHAR(32) DEFAULT NULL,
      createdBy VARCHAR(64) DEFAULT NULL,
      createdAt VARCHAR(64) DEFAULT NULL,
      demo TINYINT(1) DEFAULT 0,
      extra_data JSON DEFAULT NULL,
      INDEX idx_email (email),
      INDEX idx_phone (phone)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 2. Generic collections table for all entity stores (projects, units, attendance, materials, etc.)
  await p.query(`
    CREATE TABLE IF NOT EXISTS collections (
      store VARCHAR(128) NOT NULL,
      id VARCHAR(128) NOT NULL,
      data JSON NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (store, id),
      INDEX idx_store (store)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
}

async function getPool() {
  if (!initPromise) {
    initPromise = (async () => {
      const config = parseDbConfig();
      await createDatabaseIfNotExists(config);

      if (config.uri) {
        pool = mysql.createPool(config.uri);
      } else {
        pool = mysql.createPool(config);
      }

      // Test connectivity and create schema
      const conn = await pool.getConnection();
      conn.release();
      await initSchema(pool);
      console.log("Connected to MySQL database successfully");
      return pool;
    })().catch((err) => {
      initPromise = null; // allow retry on next request if connection failed
      pool = null;
      throw err;
    });
  }
  return initPromise;
}

function rowToUser(row) {
  if (!row) return null;
  const { extra_data, demo, ...rest } = row;
  let extra = {};
  if (extra_data) {
    try {
      extra = typeof extra_data === "string" ? JSON.parse(extra_data) : extra_data;
    } catch {}
  }
  return {
    ...extra,
    ...rest,
    demo: Boolean(demo),
  };
}

export async function getUsers() {
  const p = await getPool();
  const [rows] = await p.query("SELECT * FROM users");
  return rows.map(rowToUser);
}

export async function findUserByEmail(email) {
  if (!email) return null;
  const p = await getPool();
  const [rows] = await p.query("SELECT * FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1", [email]);
  return rows.length ? rowToUser(rows[0]) : null;
}

export async function findUserById(id) {
  if (!id) return null;
  const p = await getPool();
  const [rows] = await p.query("SELECT * FROM users WHERE id = ? LIMIT 1", [id]);
  return rows.length ? rowToUser(rows[0]) : null;
}

export async function findUserByPhoneSuffix(last10) {
  const p = await getPool();
  const [rows] = await p.query("SELECT * FROM users");
  const users = rows.map(rowToUser);
  return users.find((u) => (u.phone || "").replace(/\D/g, "").endsWith(last10)) ?? null;
}

export async function insertUser(user) {
  const p = await getPool();
  const {
    id,
    role = "client",
    name = "",
    email = "",
    phone = "",
    password = "",
    title = null,
    provider = null,
    createdBy = null,
    createdAt = new Date().toISOString(),
    demo = false,
    ...extra
  } = user;

  const extraJson = Object.keys(extra).length > 0 ? JSON.stringify(extra) : null;

  await p.query(
    `INSERT INTO users (id, role, name, email, phone, password, title, provider, createdBy, createdAt, demo, extra_data)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       role = VALUES(role),
       name = VALUES(name),
       email = VALUES(email),
       phone = VALUES(phone),
       password = VALUES(password),
       title = VALUES(title),
       provider = VALUES(provider),
       createdBy = VALUES(createdBy),
       demo = VALUES(demo),
       extra_data = VALUES(extra_data)`,
    [id, role, name, email, phone, password, title, provider, createdBy, createdAt, demo ? 1 : 0, extraJson]
  );

  return user;
}

export async function deleteUser(id) {
  const p = await getPool();
  await p.query("DELETE FROM users WHERE id = ?", [id]);
}

export async function seedAdminIfEmpty(adminDoc) {
  const p = await getPool();
  const [rows] = await p.query("SELECT COUNT(*) as count FROM users");
  if (rows[0]?.count > 0) return;
  await insertUser(adminDoc);
}

export async function getCollection(store) {
  const p = await getPool();
  const [rows] = await p.query("SELECT data FROM collections WHERE store = ?", [store]);
  return rows.map((r) => (typeof r.data === "string" ? JSON.parse(r.data) : r.data));
}

export async function insertRecord(store, record) {
  const p = await getPool();
  const json = JSON.stringify(record);
  await p.query(
    "INSERT INTO collections (store, id, data) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE data = ?",
    [store, record.id, json, json]
  );
  return record;
}

export async function patchRecord(store, id, patch) {
  const p = await getPool();
  const [rows] = await p.query("SELECT data FROM collections WHERE store = ? AND id = ? LIMIT 1", [store, id]);
  if (rows.length === 0) return null;
  const current = typeof rows[0].data === "string" ? JSON.parse(rows[0].data) : rows[0].data;
  const updated = { ...current, ...patch };
  const json = JSON.stringify(updated);
  await p.query("UPDATE collections SET data = ? WHERE store = ? AND id = ?", [json, store, id]);
  return updated;
}

export async function deleteRecord(store, id) {
  const p = await getPool();
  await p.query("DELETE FROM collections WHERE store = ? AND id = ?", [store, id]);
}

export function makeId(prefix = "REC") {
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `${prefix}-${Date.now().toString(36).toUpperCase().slice(-6)}${rand}`;
}
