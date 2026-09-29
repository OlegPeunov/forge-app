import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import bcrypt from 'bcryptjs';
import { Router, type RequestHandler } from 'express';
import jwt from 'jsonwebtoken';

type UserRecord = {
  id: string;
  email: string;
  passwordHash: string;
};

type Database = {
  users: UserRecord[];
};

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

const databasePath = resolve(__dirname, '../data/db.json');
const database = JSON.parse(readFileSync(databasePath, 'utf8')) as Database;
const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error('JWT_SECRET is not configured');
}

function publicUser(user: UserRecord) {
  return { id: user.id, email: user.email };
}

export const requireAuth: RequestHandler = (request, response, next) => {
  const authorization = request.header('authorization');
  const token = authorization?.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : null;

  if (!token) {
    response.status(401).json({ message: 'Authentication required' });
    return;
  }

  try {
    const payload = jwt.verify(token, jwtSecret);

    if (typeof payload === 'string' || typeof payload.sub !== 'string') {
      throw new Error('Invalid token payload');
    }

    request.userId = payload.sub;
    next();
  } catch {
    response.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const authRouter = Router();

authRouter.post('/auth/login', async (request, response) => {
  const email =
    typeof request.body?.email === 'string'
      ? request.body.email.trim().toLowerCase()
      : '';
  const password =
    typeof request.body?.password === 'string' ? request.body.password : '';
  const user = database.users.find((candidate) => candidate.email === email);

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    response.status(401).json({ message: 'Invalid email or password' });
    return;
  }

  const token = jwt.sign({}, jwtSecret, {
    subject: user.id,
    expiresIn: '7d',
  });

  response.json({ token, user: publicUser(user) });
});

authRouter.get('/me', requireAuth, (request, response) => {
  const user = database.users.find((candidate) => candidate.id === request.userId);

  if (!user) {
    response.status(401).json({ message: 'User not found' });
    return;
  }

  response.json({ user: publicUser(user) });
});
