import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

// Import routers (we will write these next)
import { authRouter } from './routes/auth.js';
import { sessionsRouter } from './routes/sessions.js';
import { exercisesRouter } from './routes/exercises.js';
import { progressRouter } from './routes/progress.js';
import { measurementsRouter } from './routes/measurements.js';

const app = express();
const PORT = process.env.PORT || 4000;

// Enable CORS
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://127.0.0.1:5173'
];

app.use(cors({
  origin: (origin, callback) => {
    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
    ) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(cookieParser());
app.use(express.json());

// Request logger for debugging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Base/Healthcheck route
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// API Routes
app.use('/auth', authRouter);
app.use('/sessions', sessionsRouter);
app.use('/exercises', exercisesRouter);
app.use('/progress', progressRouter);
app.use('/measurements', measurementsRouter);

// Global 404 Route
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

import { seedExercises } from './db/seed.js';

app.listen(PORT, async () => {
  console.log(`Workout Tracker API Server listening on port ${PORT}`);
  try {
    await seedExercises();
  } catch (err) {
    console.error('Failed to run database seed on startup:', err);
  }
});
