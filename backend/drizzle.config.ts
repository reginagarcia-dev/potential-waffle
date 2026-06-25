import { defineConfig } from 'drizzle-kit';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });
dotenv.config();

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/workout_tracker',
  },
});
