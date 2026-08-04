# M14 — Production Log Review Checklist (Product Owner manual gate)

> This gate cannot be completed by this agent — it requires Supabase Dashboard access, which this agent's tooling does not have. Complete this checklist after the app has been live for a meaningful window (recommended: at least 24 hours of real or near-real traffic, or immediately after the initial go-live smoke test as a first pass), then report back explicitly. This agent will not mark this gate PASS on your behalf.

**Where to look:** Supabase Dashboard → select `ptx-summer-cup-2026-production` → **Logs** (left sidebar) → each of the tabs below.

## 1. Postgres logs

- [ ] No repeated connection errors or refused connections
- [ ] No `FATAL`/`PANIC` level entries
- [ ] No unexpected `permission denied` errors on tables this app uses (`teams`, `players`, `matches`, `match_events`, `profiles`, `audit_log`, `tournament_settings`, `hall_of_fame`, `predictions`) — a small number tied to intentionally-denied anon writes is expected and healthy (proves RLS is working), a large unexplained volume is not
- [ ] No unexpected schema errors (`relation does not exist`, `column does not exist`) — would indicate drift from the certified migration set

## 2. API (PostgREST) logs

- [ ] No unexpected 5xx response spikes
- [ ] 4xx responses are consistent with expected behavior (401/403 for denied writes, 404 for genuinely-missing resources) — not evidence of a broken query path
- [ ] Response times look reasonable for the traffic volume seen (no obvious hung/slow-query pattern)

## 3. Auth logs

- [ ] Signups appear as expected (the real first-admin signup from §4, plus any real fan signups if the app supports fan accounts beyond anonymous predictions)
- [ ] No unexpected volume of failed login attempts (could indicate credential-stuffing/abuse, not just normal user error)
- [ ] No unexpected password-reset or email-change activity beyond what you initiated

## 4. Storage logs

- [ ] The initial asset upload batch (53 files) completed without unexpected failures (already confirmed once via the CLI's own success count in M13/M14, this is a second independent check via the dashboard)
- [ ] No unexpected 403/404 spikes on public asset fetches (would indicate a broken public-read policy or a broken image path somewhere in the live app)

## 5. Realtime logs

- [ ] Connections/subscriptions look proportional to actual visitor traffic (no runaway reconnect loop from a client bug)
- [ ] No unexpected error spikes on the `matches`/`match_events` channels

## 6. Application-level check (cross-reference, not a Supabase log)

- [ ] Browser console / Vercel's own function logs (if using Vercel) show no new, unexplained error class beyond what was already documented as known/expected during M13 (e.g. the R25 legacy regression's one known harness artifact is unrelated and doesn't apply here — this is about the *new* Next.js app's own runtime)

## Evidence required to mark this gate PASS

State explicitly, in your own words, back to this agent (or directly in `docs/m14-public-launch-certification.md` once that's drafted):

> "I reviewed the Supabase Dashboard Logs Explorer for [date/time window] across Postgres, API, Auth, Storage, and Realtime. [Nothing unexpected found / here's what I found: ...]. I confirm this gate as PASS."

A simple "logs look fine" without having actually opened the Dashboard does not satisfy this — the point of this gate is a real human look at real data this agent cannot see, not a rubber stamp.
