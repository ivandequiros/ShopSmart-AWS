import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { prisma } from '../lib/prisma.js';
import { endSession, requireUser, startSession } from '../lib/auth.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { loginSchema, registerSchema } from '../validators/schemas.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false
});

const publicUser = (user) => ({ id: user.id, name: user.name, email: user.email });

router.post('/register', authLimiter, async (request, response, next) => {
  try {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) {
      return response.status(422).json({ error: { code: 'INVALID_REGISTRATION', message: 'Enter a name, a valid email and a password of at least 8 characters.' } });
    }
    const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (existing) {
      return response.status(409).json({ error: { code: 'EMAIL_IN_USE', message: 'An account with that email already exists.' } });
    }
    const user = await prisma.user.create({
      data: { name: parsed.data.name, email: parsed.data.email, passwordHash: await hashPassword(parsed.data.password) }
    });
    await startSession(response, user.id);
    response.status(201).json({ user: publicUser(user) });
  } catch (error) { next(error); }
});

router.post('/login', authLimiter, async (request, response, next) => {
  try {
    const parsed = loginSchema.safeParse(request.body);
    const invalid = () => response.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect.' } });
    if (!parsed.success) return invalid();
    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) return invalid();
    await startSession(response, user.id);
    response.json({ user: publicUser(user) });
  } catch (error) { next(error); }
});

router.post('/logout', async (request, response, next) => {
  try {
    await endSession(request, response);
    response.status(204).end();
  } catch (error) { next(error); }
});

router.get('/me', requireUser, (request, response) => {
  response.json({ user: request.user });
});

export default router;
