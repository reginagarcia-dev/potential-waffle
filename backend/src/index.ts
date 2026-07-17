import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import { randomUUID } from 'crypto';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import * as Sentry from '@sentry/node';

declare global {
  namespace Express {
    interface Request {
      id: string;
    }
  }
}

// Load env files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

// Read directly off the monorepo's package.json rather than a JSON import
// attribute, to avoid any Node-version compatibility risk — this is the
// version actually bumped per release and tracked in CHANGELOG.md.
const rootPackageJson = JSON.parse(
  readFileSync(path.resolve(__dirname, '../../package.json'), 'utf-8'),
);
const appVersion: string = rootPackageJson.version;

// Sentry is entirely opt-in: without a DSN the SDK is never initialized, so
// the captureException call in the error handler below becomes a no-op.
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    release: `workout-tracker-backend@${appVersion}`,
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
import { recordVital, getVitalsSnapshot, isVitalName } from './webVitalsMetrics.js';
import { pool } from './db/index.js';

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
//
// Each request also gets a random id, echoed back as X-Request-Id and
// included in the log line, so a single request can be traced across the
// console log, /metrics, and (once tagged in the error handler below) a
// Sentry event — without it, correlating those three during an incident
// means matching timestamps by hand.
app.use((req: Request, res: Response, next: NextFunction) => {
  req.id = randomUUID();
  res.setHeader('X-Request-Id', req.id);
  const startedAt = Date.now();
  res.on('finish', () => {
    const durationMs = Date.now() - startedAt;
    recordRequest(req, res.statusCode);
    console.log(
      `[${new Date().toISOString()}] [${req.id}] ${req.method} ${req.path} ${res.statusCode} ${durationMs}ms`,
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
  // Capacitor's iOS WebView serves the app from this fixed custom scheme.
  // Android is served over https://localhost, already matched by the regex below.
  'capacitor://localhost',
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

// One page load fires up to 5 vitals (CLS/FCP/INP/LCP/TTFB), so a handful
// of tabs/reloads behind a shared IP can add up fast — sized generously so
// legitimate bursts don't get silently dropped (sendBeacon never surfaces
// a 429 to calling code, so a too-tight limit here would just quietly
// under-sample real traffic with no visible error anywhere). Read and
// write are limited separately so a dashboard polling GET /vitals can't
// starve real beacon POSTs of their own budget.
const vitalsPostLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

const vitalsGetLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

// /health now does a real DB round-trip (see below), so — like the other
// public, unauthenticated endpoints above — it needs its own limiter to
// stop it being used to exhaust the connection pool.
const healthLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/auth/login', authLimiter);
app.use('/auth/register', authLimiter);
app.use('/auth/refresh', refreshLimiter);
app.use('/health', healthLimiter);

// Healthcheck — actually checks DB connectivity rather than just confirming
// the process is up, since "app alive, database unreachable" is the most
// common real failure mode and a static {status:'ok'} would mask it from
// any external uptime monitor pointed at this endpoint. Raced against a
// short timeout (independent of the pool's own connectionTimeoutMillis) so
// a merely-busy-but-healthy pool fails fast into a clear signal instead of
// blocking the full pool timeout and reading as a worse outage than it is.
const HEALTH_CHECK_TIMEOUT_MS = 3000;
app.get('/health', async (req: Request, res: Response) => {
  try {
    await Promise.race([
      pool.query('SELECT 1'),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error('Health check DB query timed out')),
          HEALTH_CHECK_TIMEOUT_MS,
        ),
      ),
    ]);
    res.json({ status: 'ok', time: new Date().toISOString() });
  } catch (err) {
    console.error(`Health check DB query failed [${req.id}]:`, err);
    if (process.env.SENTRY_DSN) {
      Sentry.withScope((scope) => {
        scope.setTag('request_id', req.id);
        Sentry.captureException(err);
      });
    }
    res.status(503).json({ status: 'error', time: new Date().toISOString() });
  }
});

// Request/error-rate counters, in-memory and per-process — reset on
// restart and not shared across instances if scaled horizontally, but
// enough to answer "what's our error rate" for a single Render dyno.
app.get('/metrics', (req: Request, res: Response) => {
  res.json(getMetricsSnapshot());
});

// Real-user Web Vitals, reported by the frontend via sendBeacon in
// production builds only (see frontend/src/lib/webVitals.ts). Same
// in-memory/per-process tradeoff as /metrics — a live snapshot, not
// history.
app.post('/vitals', vitalsPostLimiter, (req: Request, res: Response) => {
  const { name, value } = req.body ?? {};
  if (!isVitalName(name) || typeof value !== 'number' || !Number.isFinite(value)) {
    return res.status(400).json({ error: 'Invalid vital payload' });
  }
  recordVital(name, value);
  res.status(204).end();
});

app.get('/vitals', vitalsGetLimiter, (req: Request, res: Response) => {
  res.json(getVitalsSnapshot());
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
  console.error(`Unhandled Server Error [${req.id}]:`, err);
  // Sentry.setupExpressErrorHandler's auto-instrumentation needs Express
  // patched via `node --import` before it's first imported, which this
  // ESM dev/start setup (tsx, no --import) doesn't do — so we call
  // captureException directly here instead, which works regardless. Tagging
  // with the request id lets a Sentry event be matched back to the exact
  // log line above.
  if (process.env.SENTRY_DSN) {
    Sentry.withScope((scope) => {
      scope.setTag('request_id', req.id);
      Sentry.captureException(err);
    });
  }
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

import { seedExercises } from './db/seed.js';
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
