import { db } from './src/db/index.js';
import { workoutSessions } from './src/db/schema.js';
import { eq } from 'drizzle-orm';

try {
  const result = await db.delete(workoutSessions).where(eq(workoutSessions.id, 'd2f31ac1-d9f1-4dff-a4c4-0ea6e1f03cdf')).returning();
  console.log('Result:', result);
} catch (e) {
  console.error('Error during delete:', e);
}
