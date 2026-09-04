# Design log

Append-only. One terse entry per merged decision: decision, why, alternatives rejected, consequence.

## 2026-09-03 — Production logging via Pino facade (PR #5, closes #4)

- **Decision:** Server logs go through the fleet Pino facade (`server/utils/logger.ts`, copied from `XRPL-Commons/pulse`): one JSON line per event on stdout, `dt`/`level`/`msg`/`service`/`err`/`event`, capped at 1900 encoded bytes, secrets redacted. A production-only Nitro plugin patches `console.*`, installs fatal handlers (`FATAL` + `exit(1)`), emits `event=startup`, and logs one `ERROR` per 5xx. Dev keeps pino-pretty. Tests run under vitest + tsx.
- **Why:** Better Stack ingests 2000-byte lines and fleet alerts key on `level` and `event`; unstructured `console.*` output broke both. Level discipline (`ERROR` pages a human, per-request chatter is `DEBUG`) is documented in README.
- **Alternatives rejected:** a Pino transport for the cap (Pino binds its destination at construction, so a destination wrapper is simpler and synchronous); migrating `server/client.ts` (browser-side despite its path, importing Pino would break the client bundle); shipping without a test runner (contract is now enforced by `npm test`).
- **Consequence:** New runtime deps `pino`, `pino-pretty`; dev deps `vitest`, `tsx`. `LOG_LEVEL` is a new optional env var. The redact list does not cover the `x-admin-password` header: never log raw request headers, or extend the list first.

## 2026-09-04 — Fathom analytics (closes #6)

- **Decision:** Fleet analytics via Fathom. `plugins/fathom.client.ts` (the org's reference plugin, verbatim) injects the Fathom script in production builds only; the site id `TXPDCLCO` is hard-coded in `nuxt.config.ts` as `runtimeConfig.public.fathomSiteId`.
- **Why:** Fathom is the org standard (cookie-free, no consent banner). Site ids are public, so hard-coding avoids a pointless env var and secret.
- **Alternatives rejected:** `nuxt-fathom` module (a 15-line plugin needs no dependency); an env var (`.env.example` and Passbolt stay untouched per the rollout); `app/plugins/` path from the issue (this repo uses Nuxt 3's root `srcDir`, so the plugin lives in `plugins/`).
- **Consequence:** No CSP exists in this app, so nothing to allow-list. If one is ever added, `https://cdn.usefathom.com` must be permitted in `script-src` and `connect-src`.
