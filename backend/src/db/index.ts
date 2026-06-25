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
  ssl: connectionString.includes('neon.tech') ? { rejectUnauthorized: false } : false
});

export const db = drizzle(pool, { schema });
export { pool };
