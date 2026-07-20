# Security Review — WCHGT (West Coast Hickory Golf Tour)

Scope: `/home/user/workspace/wchgt` — Express + React (TS) app, SQLite via Drizzle ORM, no user auth, no payments, public golf scores/contact info only.

## BLOCK (must fix before publishing)

**1. Admin PIN is a UI-only gate — write API endpoints have zero server-side protection.**
The PIN check (`ADMIN_PIN = "wchgt2026"` in `client/src/pages/Admin.tsx:7`) only controls whether the React admin panel *renders* its forms. It is never sent to or verified by the server. Every mutation route in `server/routes.ts` — `POST /api/golfare`, `POST /api/banor`, `POST /api/rundor`, `POST /api/tavlingar`, `PATCH /api/tavlingar/:id`, `POST /api/tavlingsresultat`, `POST /api/reportage` — is open to anyone on the internet who sends a raw HTTP request (e.g., via `curl`), no PIN required. This means anyone can add fake players, forge tournament results/scores, alter the Order of Merit standings, or post arbitrary "Reportage" articles (stored HTML/text) without ever touching the UI.
**Fix:** add a minimal server-side check — e.g., require the PIN as a header/token on all mutating routes (`POST`/`PATCH`) and reject with 401 if missing/incorrect. Given the stated low-stakes context, a simple shared-secret middleware is sufficient; no need for full auth/session infra.

## WARN (user decides — acceptable for a low-stakes community site, but flagging as requested)

**2. Admin PIN hardcoded in client bundle (`"wchgt2026"`).**
This ships in plaintext in the shipped JS bundle, so anyone can view-source it in seconds. Per your context this is acceptable for a low-stakes hobby site, but note it provides no real confidentiality — it functions more as a "speed bump" than a security control. Combine with fixing issue #1 so the PIN actually gates the API, not just the UI.

**3. No rate limiting on API endpoints.**
Nothing throttles requests to `/api/*`. Combined with issue #1, this makes bulk spam/abuse of write endpoints trivial. Even a lightweight in-memory rate limiter would help once #1 is fixed.

**4. No CORS restriction configured.**
Express has no CORS policy set, so the API can be called cross-origin from any website. Low risk here since there's no session/cookie-based auth to steal, but worth noting if you ever add authenticated features later.

**5. Reportage content (`innehall`/`ingress`) is rendered from free-text DB fields.**
Verify wherever `Reportage`/`ReportageArtikel` pages render `innehall` on the client that it's not injected via `dangerouslySetInnerHTML` without sanitization — didn't find such usage in the pages checked, but worth a quick manual confirmation since this field accepts arbitrary text and (post-fix-#1) would only be writable by trusted admins anyway.

## Checked and OK

- **No hardcoded API keys/secrets** found in source beyond the admin PIN discussed above. `.env`/`.env.*` are properly gitignored; no `.env` file present with real secrets.
- **SQL injection:** Not exploitable. All data queries go through Drizzle ORM's parameterized query builder (`eq()`, `.values()`, etc.) in `server/storage.ts`. The only raw `sqlite.exec()` calls are static DDL/seed strings with no interpolated user input.
- **`data.db`** (SQLite file) is properly excluded via `.gitignore` and not tracked in git — good, since it holds the live production data.
- Input validation on all POST routes uses Zod schemas (`insertGolfareSchema.safeParse`, etc.) before hitting the DB — good baseline for malformed-data protection, though it doesn't stop unauthorized *legitimate-shaped* writes (see #1).

## Summary
The only must-fix item is **#1**: lock down the mutating API routes server-side so the PIN actually protects data, not just the UI. Everything else is low-severity and reasonable to accept given the project's stated low-stakes, no-PII, no-payments scope.
