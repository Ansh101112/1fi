import { Pool, types } from 'pg';

// Shared Postgres pool. Cached on globalThis because Next reloads modules on
// every edit in dev, and a fresh pool per save runs Neon out of connections.

// pg returns `numeric` as a string. interest_rate is the only numeric column
// and it is a small percentage, so parse it back to a number.
const PG_NUMERIC_OID = 1700;
types.setTypeParser(PG_NUMERIC_OID, (value) => Number.parseFloat(value));

declare global {
  var __oneFiPool: Pool | undefined;
}

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is not set. Copy .env.example to .env.local and add your Neon connection string.',
    );
  }

  const pool = new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });

  // Neon scales computes down, so idle clients drop. Without a listener pg
  // turns that into an uncaught exception and kills the process.
  pool.on('error', (error) => {
    console.error('[db] idle client error', error);
  });

  return pool;
}

export const pool: Pool = globalThis.__oneFiPool ?? createPool();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__oneFiPool = pool;
}

/** Run a query, get the rows. */
export async function query<T extends Record<string, unknown>>(
  text: string,
  params: readonly unknown[] = [],
): Promise<T[]> {
  const result = await pool.query<T>(text, params as unknown[]);
  return result.rows;
}

/** Same, for queries that match at most one row. */
export async function queryOne<T extends Record<string, unknown>>(
  text: string,
  params: readonly unknown[] = [],
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}
