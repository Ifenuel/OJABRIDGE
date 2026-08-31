/**
 * ============================================
 * OJABRIDGE DATABASE CLIENT (PostgreSQL)
 * ============================================
 * 
 * Connects to Railway PostgreSQL via connection pool.
 * In development without DATABASE_URL, returns mock helpers.
 */

import { Pool } from 'pg';

let pool = null;

/**
 * Get PostgreSQL connection pool (singleton)
 */
export function getPool() {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.warn('⚠️  DATABASE_URL not configured. Set DATABASE_URL in .env.local');
    return null;
  }

  pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  // Log connection errors
  pool.on('error', (err) => {
    console.error('Unexpected database pool error:', err);
  });

  return pool;
}

/**
 * Check if database is connected
 */
export function isDatabaseConnected() {
  return !!process.env.DATABASE_URL;
}

/**
 * Helper: safely query the database
 * Returns { data, error } — if DB not connected, returns mock data
 */
export async function dbQuery(tableName, options = {}) {
  const client = getPool();

  if (!client) {
    return {
      data: null,
      error: null,
      dbConnected: false,
      message: 'Database not connected. Set DATABASE_URL in .env.local',
    };
  }

  try {
    let query = `SELECT ${options.select || '*'} FROM ${tableName}`;
    const params = [];
    let paramIndex = 1;
    const conditions = [];

    // WHERE conditions
    if (options.filter) {
      for (const [key, value] of Object.entries(options.filter)) {
        if (value !== undefined && value !== null && value !== '') {
          conditions.push(`${key} = $${paramIndex}`);
          params.push(value);
          paramIndex++;
        }
      }
    }

    // ILIKE search
    if (options.search) {
      const { column, term } = options.search;
      if (term && term.trim()) {
        conditions.push(`${column} ILIKE $${paramIndex}`);
        params.push(`%${term.trim()}%`);
        paramIndex++;
      }
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    // ORDER BY
    if (options.order) {
      const { column, ascending = false } = options.order;
      query += ` ORDER BY ${column} ${ascending ? 'ASC' : 'DESC'}`;
    }

    // LIMIT
    if (options.limit) {
      query += ` LIMIT $${paramIndex}`;
      params.push(options.limit);
      paramIndex++;
    }

    // OFFSET
    if (options.offset) {
      query += ` OFFSET $${paramIndex}`;
      params.push(options.offset);
      paramIndex++;
    }

    const result = await client.query(query, params);

    return { data: result.rows, error: null, dbConnected: true, count: result.rowCount };
  } catch (err) {
    console.error(`DB query error on ${tableName}:`, err.message);
    return { data: null, error: err.message, dbConnected: true };
  }
}

/**
 * Helper: insert into database
 */
export async function dbInsert(tableName, record) {
  const client = getPool();

  if (!client) {
    return { data: null, error: 'Database not connected', dbConnected: false };
  }

  try {
    const keys = Object.keys(record);
    const values = Object.values(record);
    const placeholders = keys.map((_, i) => `$${i + 1}`);

    const query = `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`;
    const result = await client.query(query, values);

    return { data: result.rows[0], error: null, dbConnected: true };
  } catch (err) {
    console.error(`DB insert error on ${tableName}:`, err.message);
    return { data: null, error: err.message, dbConnected: true };
  }
}

/**
 * Helper: update in database
 */
export async function dbUpdate(tableName, match, updates) {
  const client = getPool();

  if (!client) {
    return { data: null, error: 'Database not connected', dbConnected: false };
  }

  try {
    const setClauses = [];
    const params = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      setClauses.push(`${key} = $${paramIndex}`);
      params.push(value);
      paramIndex++;
    }

    const matchClauses = [];
    for (const [key, value] of Object.entries(match)) {
      matchClauses.push(`${key} = $${paramIndex}`);
      params.push(value);
      paramIndex++;
    }

    const query = `UPDATE ${tableName} SET ${setClauses.join(', ')} WHERE ${matchClauses.join(' AND ')} RETURNING *`;
    const result = await client.query(query, params);

    return { data: result.rows[0] || null, error: null, dbConnected: true };
  } catch (err) {
    console.error(`DB update error on ${tableName}:`, err.message);
    return { data: null, error: err.message, dbConnected: true };
  }
}

/**
 * Helper: delete from database
 */
export async function dbDelete(tableName, match) {
  const client = getPool();

  if (!client) {
    return { data: null, error: 'Database not connected', dbConnected: false };
  }

  try {
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(match)) {
      conditions.push(`${key} = $${paramIndex}`);
      params.push(value);
      paramIndex++;
    }

    const query = `DELETE FROM ${tableName} WHERE ${conditions.join(' AND ')}`;
    await client.query(query, params);

    return { data: null, error: null, dbConnected: true };
  } catch (err) {
    console.error(`DB delete error on ${tableName}:`, err.message);
    return { data: null, error: err.message, dbConnected: true };
  }
}

/**
 * Helper: count records
 */
export async function dbCount(tableName, filter = {}) {
  const client = getPool();

  if (!client) {
    return { count: 0, error: 'Database not connected', dbConnected: false };
  }

  try {
    let query = `SELECT COUNT(*) as count FROM ${tableName}`;
    const params = [];
    const conditions = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(filter)) {
      if (value !== undefined && value !== null) {
        conditions.push(`${key} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    const result = await client.query(query, params);

    return { count: parseInt(result.rows[0].count) || 0, error: null, dbConnected: true };
  } catch (err) {
    return { count: 0, error: err.message, dbConnected: true };
  }
}

/**
 * Helper: raw query (for complex queries)
 */
export async function dbRaw(query, params = []) {
  const client = getPool();

  if (!client) {
    return { rows: [], error: 'Database not connected', dbConnected: false };
  }

  try {
    const result = await client.query(query, params);
    return { rows: result.rows, error: null, dbConnected: true, rowCount: result.rowCount };
  } catch (err) {
    console.error('DB raw query error:', err.message);
    return { rows: [], error: err.message, dbConnected: true };
  }
}
