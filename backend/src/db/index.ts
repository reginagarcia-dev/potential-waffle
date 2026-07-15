import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load dotenv from backend folder or project root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is missing!');
}

const pool = new pg.Pool({
  connectionString,
  // If connecting to Neon over serverless/SSL, standard node-postgres might need SSL enabled
  ssl: connectionString.includes('neon.tech') ? { rejectUnauthorized: false } : false,
  // Bounds how long a query waits to acquire a connection so a dead/unreachable
  // database fails fast (e.g. at the startup schema check) instead of hanging.
  connectionTimeoutMillis: 10_000,
});

export const db = drizzle(pool, { schema });
export { pool };
