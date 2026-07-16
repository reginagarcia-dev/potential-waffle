import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import * as Sentry from '@sentry/node';

// Load env files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

// Sentry is entirely opt-in: without a DSN the SDK is never initialized, so
// the captureException call in the error handler below becomes a no-op.
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 0.1,
  });
}

// Refuse to start in production with default secrets
if (process.env.NODE_ENV === 'production') {
  const DEFAULT_JWT = 'supersecretjwtkeychangeinproduction12345';
  const DEFAULT_REFRESH = 'supersecretjwtrefreshkeychangeinproduction54321';
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === DEFAULT_JWT) {
    throw new Error('FATAL: JWT_SECRET must be set to a strong secret in production.');
  }
  if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET === DEFAULT_REFRESH) {
    throw new Error('FATAL: JWT_REFRESH_SECRET must be set to a strong secret in production.');
  }
}

import { authRouter } from './routes/auth.js';
import { sessionsRouter } from './routes/sessions.js';
import { exercisesRouter } from './routes/exercises.js';
import { progressRouter } from './routes/progress.js';
import { measurementsRouter } from './routes/measurements.js';
import { recordRequest, getMetricsSnapshot } from './metrics.js';

const app = express();
const PORT = process.env.PORT || 4000;

// Trust Render's reverse proxy so express-rate-limit can read the real client IP
app.set('trust proxy', 1);

// Request logger — registered first so it wraps every downstream
// middleware (including body-parsing). A middleware that calls next(err)
// (e.g. express.json() on a malformed body) skips every later non-error
// middleware, so a logger placed after them would silently miss those
// requests in both the console log and the /metrics counters below.
// Recorded on 'finish' (not immediately) so the log line and metrics
// reflect the actual response status and duration.
app.use((req: Request, res: Response, next: NextFunction) => {
  const startedAt = Date.now();
  res.on('finish', () => {
    const durationMs = Date.now() - startedAt;
    recordRequest(req, res.statusCode);
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${durationMs}ms`,
    );
  });
  next();
});

// Security headers
app.use(helmet());

// Enable CORS
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://127.0.0.1:5173',
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
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json({ limit: '50kb' }));

// Rate limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again in 15 minutes.' },
});

const refreshLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many token refresh requests. Please wait a moment.' },
});

app.use('/auth/login', authLimiter);
app.use('/auth/register', authLimiter);
app.use('/auth/refresh', refreshLimiter);

// Healthcheck
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Request/error-rate counters, in-memory and per-process — reset on
// restart and not shared across instances if scaled horizontally, but
// enough to answer "what's our error rate" for a single Render dyno.
app.get('/metrics', (req: Request, res: Response) => {
  res.json(getMetricsSnapshot());
});

// API Routes
app.use('/auth', authRouter);
app.use('/sessions', sessionsRouter);
app.use('/exercises', exercisesRouter);
app.use('/progress', progressRouter);
app.use('/measurements', measurementsRouter);

// 404
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  // Sentry.setupExpressErrorHandler's auto-instrumentation needs Express
  // patched via `node --import` before it's first imported, which this
  // ESM dev/start setup (tsx, no --import) doesn't do — so we call
  // captureException directly here instead, which works regardless.
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(err);
  }
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

import { seedExercises } from './db/seed.js';
import { pool } from './db/index.js';
import { verifySchemaSync } from './db/verifySchemaSync.js';

// Refuse to start if schema.ts has columns the connected database doesn't
// have yet (i.e. someone deployed a schema change without running
// `db:push` against this database) — every request touching that column
// would otherwise 500 in a way that's hard to distinguish from a hang.
const missingColumns = await verifySchemaSync(pool);
if (missingColumns.length > 0) {
  throw new Error(
    `FATAL: database is missing columns defined in schema.ts: ${missingColumns.join(', ')}. Run "npm run db:push --workspace=backend" against this database.`,
  );
}

const server = app.listen(PORT, async () => {
  console.log(`Workout Tracker API Server listening on port ${PORT}`);
  try {
    await seedExercises();
  } catch (err) {
    console.error('Failed to run database seed on startup:', err);
  }
});

// Graceful shutdown
const shutdown = () => {
  console.log('Shutting down gracefully...');
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
  setTimeout(() => {
    console.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10_000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
