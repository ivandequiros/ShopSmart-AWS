import crypto from 'node:crypto';
import { prisma } from './prisma.js';

export const SESSION_COOKIE = 'shopsmart_session';
const SESSION_DAYS = 7;
const SESSION_MS = SESSION_DAYS * 24 * 60 * 60 * 1000;

// Only a SHA-256 hash of the session token is stored, so a database leak does not expose live sessions.
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function readCookie(request, name) {
  const header = request.headers.cookie;
  if (!header) return null;
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return null;
}

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/'
  };
}

export async function startSession(response, userId) {
  const token = crypto.randomBytes(32).toString('base64url');
  await prisma.session.create({
    data: { id: hashToken(token), userId, expiresAt: new Date(Date.now() + SESSION_MS) }
  });
  response.cookie(SESSION_COOKIE, token, { ...cookieOptions(), maxAge: SESSION_MS });
}

export async function endSession(request, response) {
  const token = readCookie(request, SESSION_COOKIE);
  if (token) await prisma.session.deleteMany({ where: { id: hashToken(token) } });
  response.clearCookie(SESSION_COOKIE, cookieOptions());
}

// Attaches request.user when a valid session cookie is present. Never blocks the request.
export async function loadUser(request, _response, next) {
  request.user = null;
  const token = readCookie(request, SESSION_COOKIE);
  if (!token) return next();
  try {
    const session = await prisma.session.findUnique({
      where: { id: hashToken(token) },
      include: { user: { select: { id: true, name: true, email: true } } }
    });
    if (session && session.expiresAt > new Date()) request.user = session.user;
    next();
  } catch (error) {
    next(error);
  }
}

export function requireUser(request, response, next) {
  if (!request.user) {
    return response.status(401).json({ error: { code: 'AUTH_REQUIRED', message: 'Please sign in to continue.' } });
  }
  next();
}
