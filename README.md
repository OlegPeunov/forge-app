## Loom

Loom walkthrough: ADD_LINK_AFTER_RECORDING

# Forge

Forge is a small mobile-first fitness companion. A user signs in, completes a fixed three-session training plan in order, keeps progress across app and API restarts, and can ask a lightweight Coach for predefined guidance.

## What is implemented

- JWT login for two prepared demo accounts and persisted mobile sessions.
- A three-session plan with user-specific progress.
- Sequential unlocking: the first session starts open and each completed session unlocks the next.
- Server-calculated `completed`, `open`, and `locked` states.
- Session details, completion flow, progress persistence, loading, error, and retry states.
- A protected Coach endpoint with deterministic responses for motivation, recovery, strength, and general questions.
- A mobile Coach conversation whose history exists only while the screen is mounted.
- Responsive mobile-first UI with a constrained layout on web.

## Technology

### Mobile

- Expo and React Native
- TypeScript
- Expo Router
- React Native `StyleSheet`
- AsyncStorage for the JWT only
- Native `fetch` for API requests

### API

- Node.js and TypeScript
- Express
- JWT authentication
- bcrypt password hashes
- A local JSON file for demo users and progress

No real AI model, RevenueCat, or store integration is included. Those are intentionally outside the scope of Forge.

## Requirements

- Node.js `20.19.4` or newer
- npm
- For native testing: Expo Go on a physical device or an iOS Simulator with Expo support

## Run the API

From the repository root:

```bash
cp server/.env.example server/.env
npm --prefix server ci
npm --prefix server run dev
```

`server/.env` must contain:

```dotenv
PORT=3000
JWT_SECRET=replace-with-a-long-random-secret
```

Replace the example JWT value with a private, sufficiently long random string. The API listens on `0.0.0.0`, so it can be reached from devices on the same local network.

For a compiled server run:

```bash
npm --prefix server run build
npm --prefix server start
```

## Run the mobile app

Keep the API running, then open a second terminal at the repository root:

```bash
cp mobile/.env.example mobile/.env
npm --prefix mobile ci
npm --prefix mobile start
```

`mobile/.env` must contain the API base URL:

```dotenv
EXPO_PUBLIC_API_URL=http://localhost:3000
```

Choose a target from the Expo terminal, or start one directly:

```bash
npm --prefix mobile run web
npm --prefix mobile run ios
```

### API address by target

- Web: use `http://localhost:3000`.
- iOS Simulator: use `http://localhost:3000`.
- Physical phone: replace `localhost` with the computer's LAN IP, for example `http://192.168.1.42:3000`. The phone and computer must be on the same network, and the local firewall must allow the connection.

Restart Expo after changing `mobile/.env`.

## Demo accounts

Both accounts use the password `Forge123!`:

- `demo1@forge.app`
- `demo2@forge.app`

The password is documented only as a public demo credential. `server/data/db.json` stores bcrypt hashes, never the plaintext password.

## Main verification flow

1. Sign in as `demo1@forge.app`.
2. Confirm the Plan starts at `0 of 3 completed` with Session 1 open and Sessions 2–3 locked.
3. Open Session 1 and complete it.
4. Confirm Session 1 is completed and Session 2 is now open.
5. Reload the app and confirm progress is preserved.
6. Open Coach from Plan and send `I feel sore after training`.
7. Confirm a recovery-focused response appears.
8. Log out, sign in as `demo2@forge.app`, and confirm its Plan still starts at zero.

## API endpoints

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/health` | No | API health check |
| `POST` | `/auth/login` | No | Validate demo credentials and return a JWT |
| `GET` | `/me` | Bearer JWT | Return the authenticated user |
| `GET` | `/sessions` | Bearer JWT | Return the user's plan, statuses, `completedCount`, and `nextSessionId` |
| `POST` | `/sessions/:id/complete` | Bearer JWT | Complete an available session and return the updated plan |
| `POST` | `/coach` | Bearer JWT | Return a deterministic prepared reply for `{ "message": "..." }` |

Coach rejects empty messages and messages longer than 500 characters.

## Architecture

The repository contains two independent applications:

- `mobile/` contains Expo Router screens and small modules for API access, token storage, and shared visual constants.
- `server/` contains focused Express routers for authentication, sessions, and Coach, plus the JSON persistence adapter.

The training plan itself is a static server-side constant. `server/data/db.json` stores only users, bcrypt password hashes, and each user's completed session IDs.

## Key decisions

- Progress belongs to the user identified by the JWT.
- The client never sends `userId` as the source of truth.
- The server calculates `completed`, `open`, and `locked`; the mobile app only renders those states.
- Progress stays on the server. AsyncStorage stores only the JWT.
- Repeating a completion request is idempotent and does not duplicate progress.
- The JSON file is a deliberate simplification for a four-hour take-home assignment, not a production persistence choice.
- Coach uses prepared responses through a real authenticated API endpoint. It does not pretend to call an AI model and does not persist chat history.

## Known limitations

- The JSON store is designed for one local API process and is not suitable for concurrent production writes or horizontal scaling.
- Authentication has no registration, refresh token, password recovery, or OAuth flow.
- The mobile token is stored in AsyncStorage rather than platform secure storage.
- Coach uses English keyword matching and a small fixed response set.
- There are no automated end-to-end or API integration tests; the core flow is covered by the manual smoke scenario above.
- The project is configured for local development and has no production deployment or store configuration.

## What I would improve with one more hour

- Add automated API tests for authentication, sequential unlocking, user isolation, idempotency, and Coach validation.
- Improve expired-token handling so every protected screen consistently returns to Login.
- Add accessibility labels and a focused keyboard/screen-reader pass.
- Add a small reset script for restoring demo progress before reviews.
