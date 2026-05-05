# Frontend — Shopify Job Tracker

Next.js 15 (App Router) · TypeScript (strict) · Tailwind · shadcn/ui.

> **Skeleton only.** The full layout and conventions live in [`../ARCHITECTURE.md`](../ARCHITECTURE.md). This README focuses on day-to-day commands.

---

## Layout (summary)

```
src/
├── app/
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Skeleton landing page
│   └── globals.css          # Tailwind base + shadcn CSS variables
├── components/
│   ├── ui/                  # shadcn primitives — added via `npx shadcn add ...`
│   ├── jobs/                # JobCard, JobFilters, JobList — TODO
│   └── layout/              # Header, Sidebar — TODO
├── lib/
│   ├── utils.ts             # cn() — required by shadcn
│   ├── env.ts               # TODO: zod-validated env
│   ├── api.ts               # TODO: typed fetch wrapper
│   └── query-client.tsx     # TODO: TanStack Query provider
├── hooks/                   # TODO: useJobs, useApplications, ...
└── types/                   # TODO: TS types mirroring Pydantic schemas
```

See `../ARCHITECTURE.md` §4 for what each folder is for and where to add new code.

---

## Local development

```bash
npm install
cp .env.local.example .env.local
npm run dev      # → http://localhost:3000
```

Make sure the backend is running at `http://localhost:8000` (see `../backend/README.md`).

---

## Common commands

| Command              | Purpose                                            |
|----------------------|----------------------------------------------------|
| `npm run dev`        | Dev server with HMR                                |
| `npm run build`      | Production build                                   |
| `npm start`          | Run the production build                           |
| `npm run lint`       | ESLint                                             |
| `npm run type-check` | `tsc --noEmit`                                     |
| `npm run format`     | Prettier write (incl. tailwind class sorting)      |
| `npm run format:check` | Prettier check (CI-friendly)                     |

---

## Adding shadcn/ui components

shadcn is pre-configured (`components.json`). Install primitives as you need them:

```bash
npx shadcn@latest add button card badge input select table
```

Components land in `src/components/ui/` and are owned by this repo (no library lock-in).

---

## Conventions (TL;DR)

- **Server Components by default.** Add `"use client"` only when you need state, effects, or browser APIs.
- **`@/` is the only alias** (set in `tsconfig.json`).
- **All API access goes through `src/lib/api.ts`.** Never call `fetch` from a component.
- **Types mirror the backend.** Hand-maintained in `src/types/` from the Pydantic schemas — keep them in sync.
- **shadcn over raw Tailwind components.**
- **Strict TypeScript** is on (`strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`).

Full version in `../ARCHITECTURE.md`.
