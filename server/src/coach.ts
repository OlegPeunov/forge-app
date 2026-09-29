import { Router } from 'express';

import { requireAuth } from './auth';
import { database } from './database';

const maxMessageLength = 500;

const replies = {
  motivation: [
    'Consistency beats intensity. Keep today simple: show up, complete the next step, and let momentum build.',
    'You do not need a perfect session. Start with the first movement and give the next few minutes your full attention.',
  ],
  recovery: [
    'Recovery is part of training. Keep the next session easy, prioritize sleep and hydration, and stop if soreness feels sharp or unusual.',
    'A little soreness can be normal. Give your body time, move gently, and choose quality over intensity today.',
  ],
  strength: [
    'Strength grows through steady, repeatable work. Focus on clean technique first, then increase the challenge gradually.',
    'Track small wins: one cleaner rep, a little more control, or a modest load increase is real progress.',
  ],
  general: [
    'Keep the next step clear and manageable. Complete the session in front of you, then reassess how you feel.',
    'Stay focused on what you can do today. Good training is built from simple sessions repeated well.',
  ],
} as const;

type ReplyCategory = keyof typeof replies;

function categorize(message: string): ReplyCategory {
  if (/\b(recovery|recover|sore|soreness|rest|fatigue|tired)\b/.test(message)) {
    return 'recovery';
  }

  if (/\b(strength|strong|progress|lift|lifting|weight|weights)\b/.test(message)) {
    return 'strength';
  }

  if (/\b(consistency|consistent|motivation|motivated|habit|routine)\b/.test(message)) {
    return 'motivation';
  }

  return 'general';
}

function stableReply(message: string, category: ReplyCategory) {
  const variants = replies[category];
  const hash = [...message].reduce(
    (value, character) => (value * 31 + character.charCodeAt(0)) >>> 0,
    0,
  );

  return variants[hash % variants.length];
}

export const coachRouter = Router();

coachRouter.post('/coach', requireAuth, (request, response) => {
  const user = database.users.find((candidate) => candidate.id === request.userId);

  if (!user) {
    response.status(401).json({ message: 'User not found' });
    return;
  }

  const message =
    typeof request.body?.message === 'string' ? request.body.message.trim() : '';

  if (!message) {
    response.status(400).json({ message: 'Message is required' });
    return;
  }

  if (message.length > maxMessageLength) {
    response
      .status(400)
      .json({ message: `Message must be ${maxMessageLength} characters or fewer` });
    return;
  }

  const normalizedMessage = message.toLowerCase();
  const category = categorize(normalizedMessage);

  response.json({ reply: stableReply(normalizedMessage, category) });
});
