import { Pool, types } from 'pg';

/**
 * Postgres connection pool, shared across the whole server runtime.
 *
 * Next.js reloads modules on every edit in development, so the pool is stashed
 * on `globalThis`. Without that, each hot reload would open a fresh pool and
 * Neon would start refusing connections after a handful of saves.
 */

// `numeric` arrives from node-postgres as a string to protect precision on
// large values. Our only numeric column is emi_plans.interest_rate, a
// percentage with two decimal places that sits comfortably inside a float64,
// so we parse it here and let the rest of the codebase treat rates as numbers.
// Every money column is `integer`, which pg already yields as a number.
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

  // A pooled client can fail while idle (Neon scales computes down). Without a
  // listener, node-postgres escalates that to an uncaught exception and takes
  // the server process with it.
  pool.on('error', (error) => {
    console.error('[db] idle client error', error);
  });

  return pool;
}

export const pool: Pool = globalThis.__oneFiPool ?? createPool();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__oneFiPool = pool;
}

/** Runs a parameterised query and returns just the rows. */
export async function query<T extends Record<string, unknown>>(
  text: string,
  params: readonly unknown[] = [],
): Promise<T[]> {
  const result = await pool.query<T>(text, params as unknown[]);
  return result.rows;
}

/** Runs a query expected to match at most one row. */
export async function queryOne<T extends Record<string, unknown>>(
  text: string,
  params: readonly unknown[] = [],
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}
