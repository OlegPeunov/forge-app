import { Router } from 'express';

import { requireAuth } from './auth';
import { database, saveDatabase, type UserRecord } from './database';

type SessionStatus = 'completed' | 'open' | 'locked';

const sessions = [
  {
    id: 'session-1',
    order: 1,
    title: 'Foundation',
    description: 'Build a strong base with controlled full-body movements.',
    durationMinutes: 20,
    focusItems: ['Mobility', 'Squat pattern', 'Core control'],
  },
  {
    id: 'session-2',
    order: 2,
    title: 'Strength',
    description: 'Add steady strength work while keeping clean technique.',
    durationMinutes: 25,
    focusItems: ['Push', 'Pull', 'Single-leg strength'],
  },
  {
    id: 'session-3',
    order: 3,
    title: 'Conditioning',
    description: 'Combine the previous skills in a short conditioning session.',
    durationMinutes: 30,
    focusItems: ['Work capacity', 'Full-body circuit', 'Cooldown'],
  },
] as const;

function getUser(userId: string | undefined) {
  return database.users.find((user) => user.id === userId);
}

function buildPlan(user: UserRecord) {
  const completedIds = new Set(user.completedSessionIds);
  let previousSessionsCompleted = true;

  const planSessions = sessions.map((session) => {
    let status: SessionStatus;

    if (completedIds.has(session.id)) {
      status = 'completed';
    } else if (previousSessionsCompleted) {
      status = 'open';
    } else {
      status = 'locked';
    }

    previousSessionsCompleted =
      previousSessionsCompleted && status === 'completed';

    return { ...session, status };
  });

  return {
    sessions: planSessions,
    completedCount: planSessions.filter(
      (session) => session.status === 'completed',
    ).length,
    nextSessionId:
      planSessions.find((session) => session.status === 'open')?.id ?? null,
  };
}

export const sessionsRouter = Router();

sessionsRouter.get('/sessions', requireAuth, (request, response) => {
  const user = getUser(request.userId);

  if (!user) {
    response.status(401).json({ message: 'User not found' });
    return;
  }

  response.json(buildPlan(user));
});

sessionsRouter.post(
  '/sessions/:id/complete',
  requireAuth,
  (request, response) => {
    const user = getUser(request.userId);

    if (!user) {
      response.status(401).json({ message: 'User not found' });
      return;
    }

    const currentPlan = buildPlan(user);
    const targetSession = currentPlan.sessions.find(
      (session) => session.id === request.params.id,
    );

    if (!targetSession) {
      response.status(404).json({ message: 'Session not found' });
      return;
    }

    if (targetSession.status === 'locked') {
      response.status(409).json({ message: 'Session is locked' });
      return;
    }

    if (targetSession.status === 'open') {
      user.completedSessionIds.push(targetSession.id);
      saveDatabase();
    }

    response.json(buildPlan(user));
  },
);
