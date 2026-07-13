# Rental Admin Dashboard

Desktop-optimized admin panel for a multi-vendor rental marketplace covering products & gadgets, properties & spaces, human resources, and sales bookings.

This repository is the **Admin Panel** surface of the platform (Super Admin → General Admins → HODs → Staff). Vendor and customer portals live in separate applications.

---

## Current phase

| Focus | Status |
| --- | --- |
| **Super Admin** UI + mock data | Active |
| General Admin / HOD / Staff portals | Deferred |
| Live Django API | Later — call sites stay API-ready via helpers |

Build **role by role**. Do not scaffold other admin roles until Super Admin is solid.

---

## Stack

| Layer | Choice |
| --- | --- |
| Bundler | Vite |
| UI | React 18+ + TypeScript |
| Routing | React Router |
| Styling | Custom Tailwind CSS (theme tokens; no component libraries unless requested) |
| Reads | SWR via shared helpers |
| Mutations | Axios via shared helpers |
| Locale | India / INR defaults (GST-aware labels) |

Backend target: Django API. Phase 1 uses mocks that match future response shapes.

---

## Planned structure

```text
src/
  api/            # axios client, helpers, endpoints
  mocks/          # fixtures + mock handlers
  auth/           # AuthContext, route guards
  layouts/        # Admin shell, sidebar, topbar
  pages/          # Route-level screens (by role)
  components/ui/  # Shared primitives only
  types/          # Shared domain types
  styles/         # Theme tokens / global CSS
```

- Pages stay thin: UI + hooks.
- HTTP access goes through `src/api/` only — no raw `fetch` / axios in pages.
- Repeated visuals belong in `components/ui/`.

---

## Getting started

> App scaffolding lands with the first Super Admin implementation. Once present:

```bash
# Install
npm install

# Local env
cp .env.example .env
# Set VITE_API_BASE_URL when pointing at a real API

# Dev server
npm run dev

# Production build
npm run build
```

---

## Data access conventions

| Method | Pattern |
| --- | --- |
| `GET` | SWR helper only (`useApiSWR` / shared fetcher) |
| `POST` / `PUT` / `PATCH` / `DELETE` | Axios helpers (`apiPost`, `apiPut`, `apiPatch`, `apiDelete`) |

- One axios instance: `baseURL` from `VITE_API_BASE_URL`, auth header, normalized errors.
- Path strings live in `endpoints.ts` — never hardcode URLs in pages.
- After list/detail mutations, call SWR `mutate` so the UI stays consistent.
- Mocks must return the **same shapes** as the future Django API.

---

## UI standards

- Desktop-first admin density: readable tables, filter bars, clear hierarchy.
- Colors via CSS variables / theme tokens (`bg-surface`, `text-primary`, `bg-accent`).
- Palette: slate/carbon neutrals, muted teal accent, status colors (amber / red / emerald).
- Every interactive control needs accessible labels, visible focus, and keyboard-friendly dialogs.
- Cover **loading / empty / error / success** on every data-backed screen.

---

## Platform context (brief)

The wider marketplace supports:

- **Listing-fee** and **commission** monetization models (GST invoices)
- Granular RBAC with MFA for admin tiers
- Immutable audit logging
- Multi-step listing approval (RBO → Admin Staff → General Admin)
- Booking lifecycle: Pending → Confirmed → Processing → Ready → Active → Completed (plus Cancelled / Rejected)
- Deal Desk for high-value mediated chat

This repo implements the **admin web dashboard** for those capabilities, starting with Super Admin.

---

## Repository hygiene

Tracked:

- Source and config when added
- `README.md`
- Cursor project rules under `.cursor/rules/` (team conventions)

Ignored (see `.gitignore`):

- Dependencies, build output, env secrets
- OS / editor noise
- Local docs such as the SRS `.docx`

---

## License

Proprietary — Tortilon. All rights reserved.
