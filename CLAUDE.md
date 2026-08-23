# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Electionma is a full-stack teacher voter management system for Maharashtra MLC elections. It supports hierarchical voter search (District → Taluka → Village → Institute), volunteer status tracking, and admin analytics with Excel/PDF export.

## Commands

### Client (`/client`)
```bash
npm run dev       # Start Vite dev server on port 5173
npm run build     # Production build
npm run lint      # ESLint
npm run preview   # Preview production build locally
```

### Server (`/server`)
```bash
npm run dev       # Start with nodemon (auto-reload)
npm start         # Production mode
npm run seed      # Seed sample voter data
```

### Data Management (run from `/server`)
```bash
node seedAdmin.js <username> <password>   # Create/update admin credentials
node scripts/importVoters.js             # Import voters from file
node scripts/clearVoters.js             # Clear voter collection
```

## Architecture

**Frontend:** React 19 + Vite SPA, deployed to Netlify (`client/public/_redirects` handles SPA routing). API calls go through `client/src/api.js` which reads `VITE_API_URL` for the base URL, falling back to `http://localhost:5000`.

**Backend:** Express 5 REST API on port 5000. MongoDB via Mongoose. Server entry point is `server/server.js`.

**Database:** MongoDB Atlas. Connection string in `server/.env` as `MONGO_URI`. Two collections:
- `voters` — indexed on `{ district, taluka, village, institute }` (compound) and `{ electorName: "text" }` (full-text search)
- `admins` — bcrypt-hashed passwords, JWT auth (12h expiry)

## Key Architectural Patterns

**Two separate auth systems:**
- Volunteer/voter login: credentials are hardcoded in the frontend (`username: "MLC2026@MC"`, `password: "MC@MLC2026"`), storing `voterToken` in localStorage.
- Admin login: JWT via `POST /api/admin/login`, token stored as `localStorage.adminToken`, verified server-side in `server/middleware/adminAuth.js`. Fallback JWT secret in code — must set `JWT_SECRET` in `.env` for production.

**Protected routes:** `client/src/components/ProtectedAdminRoute.jsx` wraps admin pages; checks for `adminToken`.

**Request cancellation:** Dashboard uses `AbortController` and request ID sequencing to drop stale responses when filters change rapidly — don't remove this pattern.

**Export pipeline:** Both Excel (ExcelJS) and PDF (PDFKit) exports are generated server-side in `server/routes/voterRoutes.js` and streamed to the client. PDFKit uses custom fonts from `server/fonts/` for Devanagari text. The client also has jsPDF available but the primary export path is server-side.

**Voter status:** Three states — `"pending"` / `"done"` / `"not_done"` — updated via `PATCH /api/voters/:id/status`. Status drives color coding both in the UI (`client/src/status-colors.css`) and in exported files.

## Environment Variables

Server (`server/.env`):
```
MONGO_URI=<MongoDB Atlas connection string>
JWT_SECRET=<secret>
PORT=5000
CLIENT_ORIGIN=<allowed CORS origin>
```

Client (`.env` in `/client` for local dev):
```
VITE_API_URL=http://localhost:5000
```
