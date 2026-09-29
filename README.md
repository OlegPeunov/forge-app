# Forge

## Run

Requires Node.js 20.19.4 or newer.

```bash
cp server/.env.example server/.env
cp mobile/.env.example mobile/.env

cd server
npm install
npm run dev
```

In another terminal:

```bash
cd mobile
npm install
npm start
```

For a physical phone, replace `localhost` in `mobile/.env` with the computer's LAN IP.

## Demo accounts

Both accounts use the password `Forge123!`:

- `demo1@forge.app`
- `demo2@forge.app`
