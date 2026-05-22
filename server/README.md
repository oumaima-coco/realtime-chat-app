# Server — Realtime Chat Backend

Node.js + Express + TypeScript backend for the Realtime Chat App.

## Stack

- Node.js 22 + TypeScript
- Express 4
- dotenv for environment configuration
- cors for cross-origin support

## Folder structure

```
server/
├── src/
│   ├── config/         # Environment & app configuration loaders
│   ├── controllers/    # Request handlers (business logic)
│   ├── middleware/     # Reusable per-request logic (auth, logging, etc.)
│   ├── routes/         # URL → controller mappings
│   └── index.ts        # Entry point: wires everything together
├── .env                # Local environment variables (NOT committed)
├── .env.example        # Template showing required env vars
├── package.json
└── tsconfig.json
```

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Run with hot reload (TypeScript, no compile step) |
| `npm run build` | Compile TypeScript → JavaScript into `dist/` |
| `npm run start` | Run the compiled JavaScript (production mode) |
| `npm run type-check` | Validate types without producing output |

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Copy the env template and fill in values
cp .env.example .env

# 3. Run the dev server
npm run dev
```

Visit `http://localhost:3000/health` — you should see a JSON status response.# Server � Node.js + Express backend (coming in Phase 2)
