# Design log

Append-only. One terse entry per merged decision: decision, why, alternatives rejected, consequence.

## 2026-09-03 — Production logging via Pino facade (PR #5, closes #4)

- **Decision:** Server logs go through the fleet Pino facade (`server/utils/logger.ts`, copied from `XRPL-Commons/pulse`): one JSON line per event on stdout, `dt`/`level`/`msg`/`service`/`err`/`event`, capped at 1900 encoded bytes, secrets redacted. A production-only Nitro plugin patches `console.*`, installs fatal handlers (`FATAL` + `exit(1)`), emits `event=startup`, and logs one `ERROR` per 5xx. Dev keeps pino-pretty. Tests run under vitest + tsx.
- **Why:** Better Stack ingests 2000-byte lines and fleet alerts key on `level` and `event`; unstructured `console.*` output broke both. Level discipline (`ERROR` pages a human, per-request chatter is `DEBUG`) is documented in README.
- **Alternatives rejected:** a Pino transport for the cap (Pino binds its destination at construction, so a destination wrapper is simpler and synchronous); migrating `server/client.ts` (browser-side despite its path, importing Pino would break the client bundle); shipping without a test runner (contract is now enforced by `npm test`).
- **Consequence:** New runtime deps `pino`, `pino-pretty`; dev deps `vitest`, `tsx`. `LOG_LEVEL` is a new optional env var. The redact list does not cover the `x-admin-password` header: never log raw request headers, or extend the list first.
