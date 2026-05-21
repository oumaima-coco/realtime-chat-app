# Realtime Chat App

A multi-room realtime chat application built to learn modern full-stack development patterns.

## Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Backend:** Node.js + Express + TypeScript
- **Realtime:** Socket.io (WebSockets)
- **Database:** PostgreSQL
- **Auth:** JWT (JSON Web Tokens) + bcrypt

## Project structure

```
realtime-chat-app/
├── client/      # React frontend (Vite)
├── server/      # Node.js + Express backend
├── docs/        # Architecture notes & diagrams
└── README.md
```

## Features

> This project is being built in 12 phases. Features below are checked off as each phase completes.

- [x] Phase 1 — Project foundation & repo setup
- [ ] Phase 2 — Express backend skeleton
- [ ] Phase 3 — PostgreSQL schema & migrations
- [ ] Phase 4 — Authentication (register / login / JWT)
- [ ] Phase 5 — React + Vite frontend skeleton
- [ ] Phase 6 — Auth UI wired to backend
- [ ] Phase 7 — Socket.io integration (first realtime message)
- [ ] Phase 8 — Multi-room support
- [ ] Phase 9 — Message persistence & history
- [ ] Phase 10 — Presence, typing indicators, online users
- [ ] Phase 11 — Security, validation, error handling
- [ ] Phase 12 — Deployment, polish, demo

## Getting started

> Setup instructions will be filled in starting Phase 2 once there's something to run.

## Why this project

Real-time messaging is one of the most interesting problems in web development. It forces you to think about state synchronization across clients, the difference between ephemeral and persistent data, authentication over long-lived connections, and graceful failure when things disconnect. Building one from scratch — without copy-pasting from a tutorial — is how you actually learn the patterns that show up in production codebases.

## License

MIT