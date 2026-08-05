# M14 — First Real Admin: Promotion Evidence

## Pre-promotion gate (all read-only, all passed)

| # | Check | Result |
|---|---|---|
| 1 | Production ref | `tqdsvtuspehavhcygipf`, `ACTIVE_HEALTHY` |
| 2 | Real identity in `auth.users` | Exactly 1 user: `d701549a-00df-4b56-a345-3ee6e1c82518`, `baoanhtran071096@gmail.com`, provider `email`, confirmed |
| 3 | `profiles` row auto-created by trigger | Present, `role: viewer` at time of check |
| 4 | `profiles.id` == `auth.users.id` | Exact match |
| 5 | Initial role | `viewer` |
| 6 | No existing/duplicate admin | 0 rows with `role = 'admin'` before promotion |
| 7 | Schema/RLS drift | None — `verify-data-parity.js`: PARITY OK; `migration list --linked`: 11/11 matching; anon still denied `audit_log` read |
| 8 | Denylisted project untouched | `wmamuqylqqikvseuqerm`: `INACTIVE`, unchanged |

**No password was requested, retrieved, reset, exposed, printed, or logged at any point.**

## Promotion performed

Single `PATCH` on `profiles.role` only, for this exact `id`, from `viewer` to `admin`:

```
PATCH /rest/v1/profiles?id=eq.d701549a-00df-4b56-a345-3ee6e1c82518
{"role":"admin"}
→ HTTP 200
```

No other field touched. No `auth.users` row modified. No password/credential field involved.

## Post-promotion verification (all passed)

| Check | Result |
|---|---|
| `auth.users` identity unchanged | Still exactly 1 user, same `id`, same `created_at` — untouched |
| `profiles.id` linkage | Still exact match |
| `profiles.role` | `admin`, confirmed |
| No second admin created | Exactly 1 row with `role = 'admin'` — this one |
| RLS/RBAC still enforced | Anon read `audit_log` → `[]`; anon write `teams` → 0 rows changed, `ovr` still `89` |
| No unrelated production data changed | `verify-data-parity.js`: PARITY OK (teams 3/3, players 24/24, matches 3/3) |
| Staging untouched | `ACTIVE_HEALTHY`, unaffected |
| Denylisted project untouched | `INACTIVE`, unaffected |

## Status

The role-promotion step is complete and verified. **The gate is not yet PASS** — per the directive, this agent will not attempt to log in as the product owner or request the password. Remaining steps require the product owner to personally log in at the real production URL.

## Next step (product owner action)

Please log in yourself at:

**https://ptx-summer-cup-2026-production.vercel.app/dang-nhap**

using the account and password you created. Once logged in, tell me you're in (no need to share anything else), and I'll verify:
- Your authenticated session reaches `/admin` successfully
- One controlled, real admin action (e.g. viewing `/admin/teams`, or a harmless idempotent edit)
- The resulting `audit_log` entry appears correctly on `/admin/audit-log`
- No RLS/privilege regression from any of the above

Only after all of that is confirmed will I mark the First Real Admin gate PASS.
