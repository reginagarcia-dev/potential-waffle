import { is } from 'drizzle-orm';
import { PgTable, getTableConfig } from 'drizzle-orm/pg-core';
import pg from 'pg';
import * as schema from './schema.js';

// Compares the columns drizzle expects (from schema.ts) against what actually
// exists in the connected database. Catches the case where schema.ts was
// changed and deployed but the corresponding `drizzle-kit push` was never run
// against that database — a query touching the new column then 500s for
// every user instead of failing at startup where it's obvious.
export async function verifySchemaSync(pool: pg.Pool): Promise<string[]> {
  const tables = (Object.values(schema) as unknown[]).filter(
    (value): value is PgTable<any> => is(value, PgTable),
  );

  const expected = tables.flatMap((table) => {
    const config = getTableConfig(table);
    return config.columns.map((column) => ({
      table: config.name,
      column: column.name,
    }));
  });

  let rows: Array<{ table_name: string; column_name: string }>;
  try {
    ({ rows } = await pool.query(
      `SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = 'public'`,
    ));
  } catch (err) {
    // Connection failures (e.g. ECONNREFUSED) can surface as an AggregateError
    // with an empty top-level `.message`, so fall back to `.code` / `.errors`.
    const detail =
      (err as Error)?.message ||
      (err as { code?: string }).code ||
      (err as { errors?: unknown[] }).errors?.map(String).join(', ') ||
      String(err);
    throw new Error(
      `Could not verify database schema (connection failed, not a schema mismatch): ${detail}`,
    );
  }
  const actual = new Set(rows.map((row) => `${row.table_name}.${row.column_name}`));

  return expected
    .filter(({ table, column }) => !actual.has(`${table}.${column}`))
    .map(({ table, column }) => `${table}.${column}`);
}
