# Phase 1 Recap — Project Foundation & Git Fundamentals

> Personal notes from completing Phase 1 of the Realtime Chat App project.
> This document is for my own reference and for any future interviewer who wants
> to see how I approached learning the foundations.

## What I built

A clean monorepo skeleton ready for a full-stack chat application:

```
realtime-chat-app/
├── client/      # React frontend (placeholder for Phase 5)
├── server/      # Node.js + Express backend (placeholder for Phase 2)
├── docs/        # Architecture notes and recaps
├── .gitignore   # Files Git should never track
└── README.md    # Project overview with 12-phase roadmap
```

The project is on GitHub as a public repo, with a first commit properly attributed
to my GitHub profile via a privacy-protected email.

---

## Concept 1 — Why a monorepo

A **monorepo** is a single Git repository containing multiple related projects.
For a full-stack app, the two projects are the **client** (frontend, runs in the
browser) and the **server** (backend, runs on a machine somewhere). They could
live in two separate repos, but a monorepo is the modern standard for projects
of this size because:

- The client and server evolve together. Changing an API endpoint usually
  requires updating the frontend that calls it. Keeping them in one repo means
  one commit can update both — no out-of-sync versions.
- A single `README` and onboarding flow for the whole project.
- Easier deployment scripts and CI/CD pipelines.

The trade-off: monorepos grow large over time. For huge teams (Google, Meta),
that creates tooling challenges. For a portfolio project, monorepo is the
correct choice.

---

