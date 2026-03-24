const { neon } = require("@neondatabase/serverless");

const sql = neon(process.env.DATABASE_URL);

// Create tables on first run
async function initDB() {
  await sql`
    CREATE TABLE IF NOT EXISTS user_profile (
      user_id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      display_name TEXT DEFAULT '',
      avatar_url TEXT DEFAULT '',
      timezone TEXT DEFAULT '',
      currency TEXT DEFAULT 'PHP',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS user_day_data (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES user_profile(user_id),
      date_key TEXT NOT NULL,
      data JSONB NOT NULL DEFAULT '{}',
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, date_key)
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS user_store (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES user_profile(user_id),
      store_key TEXT NOT NULL,
      data JSONB NOT NULL DEFAULT '{}',
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, store_key)
    )
  `;
  console.log("Database tables ready");
}

// User profile — auto-create on first sign-in
async function getOrCreateProfile(userId, email) {
  const rows = await sql`
    INSERT INTO user_profile (user_id, email, updated_at)
    VALUES (${userId}, ${email}, NOW())
    ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW()
    RETURNING *
  `;
  return rows[0];
}

async function getProfile(userId) {
  const rows = await sql`SELECT * FROM user_profile WHERE user_id = ${userId}`;
  return rows.length > 0 ? rows[0] : null;
}

async function updateProfile(userId, fields) {
  const { display_name, timezone, currency } = fields;
  const rows = await sql`
    UPDATE user_profile
    SET display_name = COALESCE(${display_name}, display_name),
        timezone = COALESCE(${timezone}, timezone),
        currency = COALESCE(${currency}, currency),
        updated_at = NOW()
    WHERE user_id = ${userId}
    RETURNING *
  `;
  return rows.length > 0 ? rows[0] : null;
}

// Day data
async function getDayData(userId, dateKey) {
  const rows = await sql`
    SELECT data FROM user_day_data
    WHERE user_id = ${userId} AND date_key = ${dateKey}
  `;
  return rows.length > 0 ? rows[0].data : null;
}

async function saveDayData(userId, dateKey, data) {
  await sql`
    INSERT INTO user_day_data (user_id, date_key, data, updated_at)
    VALUES (${userId}, ${dateKey}, ${JSON.stringify(data)}, NOW())
    ON CONFLICT (user_id, date_key)
    DO UPDATE SET data = ${JSON.stringify(data)}, updated_at = NOW()
  `;
}

async function listDates(userId) {
  const rows = await sql`
    SELECT date_key FROM user_day_data
    WHERE user_id = ${userId}
    ORDER BY date_key
  `;
  return rows.map((r) => r.date_key);
}

// Generic key-value store (routines, learning, achievements, etc.)
const ALLOWED_STORE_KEYS = [
  "routines",
  "learning_active",
  "achievements",
  "weight_history",
  "gym_routines",
  "gym_weekly",
  "closedMonths",
];

function isValidStoreKey(key) {
  if (ALLOWED_STORE_KEYS.includes(key)) return true;
  if (/^monthlyFinance_\d{4}-\d{2}$/.test(key)) return true;
  return false;
}

async function getStore(userId, storeKey) {
  const rows = await sql`
    SELECT data FROM user_store
    WHERE user_id = ${userId} AND store_key = ${storeKey}
  `;
  return rows.length > 0 ? rows[0].data : null;
}

async function saveStore(userId, storeKey, data) {
  await sql`
    INSERT INTO user_store (user_id, store_key, data, updated_at)
    VALUES (${userId}, ${storeKey}, ${JSON.stringify(data)}, NOW())
    ON CONFLICT (user_id, store_key)
    DO UPDATE SET data = ${JSON.stringify(data)}, updated_at = NOW()
  `;
}

module.exports = {
  initDB,
  getOrCreateProfile,
  getProfile,
  updateProfile,
  getDayData,
  saveDayData,
  listDates,
  getStore,
  saveStore,
  isValidStoreKey,
};
