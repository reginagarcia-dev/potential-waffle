import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { eq, and, gt, isNull } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users, workoutSessions, passwordResetTokens } from '../db/schema.js';
import { registerSchema, loginSchema, updatePreferencesSchema } from 'shared';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { sendPasswordResetEmail } from '../services/email.js';

export const authRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeychangeinproduction12345';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'supersecretjwtrefreshkeychangeinproduction54321';

// Cookie settings for refresh token
const isProd = process.env.NODE_ENV === 'production';
// The frontend proxies /api requests through its own domain (see frontend/vercel.json),
// so this cookie is always first-party — no need for SameSite=None.
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProd,
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

function generateTokens(userId: string) {
  const accessToken = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
}

// 1. Register
authRouter.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.errors[0].message });
    }

    const { email, password } = parseResult.data;

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase().trim()),
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email is already registered' });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert user
    const [newUser] = await db.insert(users).values({
      email: email.toLowerCase().trim(),
      passwordHash,
    }).returning();

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(newUser.id);

    // Set refresh token cookie
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

    return res.status(201).json({
      accessToken,
      user: {
        id: newUser.id,
        email: newUser.email,
        preferredUnit: newUser.preferredUnit,
        defaultRestSeconds: newUser.defaultRestSeconds,
        createdAt: newUser.createdAt.toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// 2. Login
authRouter.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.errors[0].message });
    }

    const { email, password } = parseResult.data;

    // Find user
    const user = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase().trim()),
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    // Set refresh token cookie
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

    return res.json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        preferredUnit: user.preferredUnit,
        defaultRestSeconds: user.defaultRestSeconds,
        createdAt: user.createdAt.toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// 3. Logout
authRouter.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('refreshToken', REFRESH_COOKIE_OPTIONS);
  return res.json({ message: 'Successfully logged out' });
});

// 4. Refresh token
authRouter.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token missing' });
    }

    jwt.verify(refreshToken, JWT_REFRESH_SECRET, async (err: any, decoded: any) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid or expired refresh token' });
      }

      if (!decoded || !decoded.userId) {
        return res.status(403).json({ error: 'Malformed refresh token claims' });
      }

      const user = await db.query.users.findFirst({
        where: eq(users.id, decoded.userId),
      });

      if (!user) {
        return res.status(403).json({ error: 'User associated with token not found' });
      }

      // Generate new tokens
      const tokens = generateTokens(user.id);

      // Set new refresh token cookie
      res.cookie('refreshToken', tokens.refreshToken, REFRESH_COOKIE_OPTIONS);

      return res.json({
        accessToken: tokens.accessToken,
        user: {
          id: user.id,
          email: user.email,
          preferredUnit: user.preferredUnit,
          defaultRestSeconds: user.defaultRestSeconds,
          createdAt: user.createdAt.toISOString(),
        },
      });
    });
  } catch (error) {
    next(error);
  }
});

// 5. Get current user
authRouter.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, req.userId!),
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      id: user.id,
      email: user.email,
      preferredUnit: user.preferredUnit,
      defaultRestSeconds: user.defaultRestSeconds,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// 6. Delete account
authRouter.delete('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const [deleted] = await db
      .delete(users)
      .where(eq(users.id, req.userId!))
      .returning();

    if (!deleted) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.clearCookie('refreshToken', REFRESH_COOKIE_OPTIONS);
    return res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// 7. Update preferences
authRouter.patch('/preferences', authenticateToken, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const parseResult = updatePreferencesSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.errors[0].message });
    }

    const { preferredUnit, defaultRestSeconds } = parseResult.data;

    const [updatedUser] = await db
      .update(users)
      .set({
        preferredUnit,
        defaultRestSeconds,
      })
      .where(eq(users.id, req.userId!))
      .returning();

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Sync unit to any active session so the workout UI updates immediately
    await db
      .update(workoutSessions)
      .set({ unit: preferredUnit })
      .where(and(eq(workoutSessions.userId, req.userId!), eq(workoutSessions.status, 'active')));

    return res.json({
      id: updatedUser.id,
      email: updatedUser.email,
      preferredUnit: updatedUser.preferredUnit,
      defaultRestSeconds: updatedUser.defaultRestSeconds,
      createdAt: updatedUser.createdAt.toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// 8. Forgot password — always returns 200 to avoid email enumeration
authRouter.post('/forgot-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const email = (req.body.email ?? '').toLowerCase().trim();
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await db.query.users.findFirst({ where: eq(users.email, email) });

    if (user) {
      // Invalidate any existing unused tokens for this user
      await db
        .update(passwordResetTokens)
        .set({ usedAt: new Date() })
        .where(and(eq(passwordResetTokens.userId, user.id), isNull(passwordResetTokens.usedAt)));

      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await db.insert(passwordResetTokens).values({ userId: user.id, token, expiresAt });

      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
      await sendPasswordResetEmail(user.email, resetUrl);
    }

    // Same response whether user exists or not
    return res.json({ message: 'If that email is registered, a reset link has been sent.' });
  } catch (error) {
    next(error);
  }
});

// 9. Reset password
authRouter.post('/reset-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const resetToken = await db.query.passwordResetTokens.findFirst({
      where: eq(passwordResetTokens.token, token),
    });

    if (!resetToken) return res.status(400).json({ error: 'Invalid or expired reset link' });
    if (resetToken.usedAt) return res.status(400).json({ error: 'This reset link has already been used' });
    if (resetToken.expiresAt < new Date()) return res.status(400).json({ error: 'This reset link has expired' });

    const passwordHash = await bcrypt.hash(password, 10);

    await db.transaction(async (tx) => {
      await tx.update(users).set({ passwordHash }).where(eq(users.id, resetToken.userId));
      await tx.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.id, resetToken.id));
    });

    return res.json({ message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
});
