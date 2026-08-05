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

## Runtime session verification (product owner logged in personally)

Password/session credentials were never requested, seen, or handled by this agent at any point.

## Controlled real-admin action — evidence, including a reported deviation

**Reported action:** one Save on `/admin/teams`. **Correction issued afterward by the product owner:** the Save button was accidentally clicked twice on what was believed to be the same team. Per instruction, this deviation is recorded exactly as observed, not normalized to match the original single-action framing.

**Actual database evidence (read-only queries against production):**

| # | Check | Result |
|---|---|---|
| 1 | Exact count of resulting audit events | **2** `audit_log` rows |
| 2 | Both Save attempts reached the Server Action/write path | Yes — `recordAuditLog()` is only ever invoked from inside `updateTeamAction`, never from a raw REST call, so the existence of 2 rows is direct proof both attempts executed the full server action including the DB write |
| 3 | One or two audit_log entries | 2, `action: "update"`, `entity_type: "team"`, timestamps `2026-08-05T05:37:51.950635Z` and `2026-08-05T05:37:55.048966Z` (4s apart) |
| 4 | Both attributable to the authenticated admin identity | Yes — both `actor_id = d701549a-00df-4b56-a345-3ee6e1c82518`, no other actor involved |
| **⚠️** | **Entity identity — discrepancy vs. stated recollection** | **The two entries are for entity_id `x` and entity_id `p` — two different teams, not the same team clicked twice.** Flagged exactly as observed; not reconciled to the "same team" framing in the correction message |
| 5 | No business field values changed unexpectedly | Current `teams.stats` for both `x` and `p` exactly matches the `metadata` recorded in their respective audit_log entries; `captain_name` unchanged on both |
| 6 | Metadata-only changes (`updated_at`) | All 3 teams show an identical, prior-day `updated_at` (`2026-08-04T17:23:46.401751Z`), untouched by either Save. Root cause confirmed by reading `src/services/database/teams.db.ts` (`updateTeam()`): the `.update()` payload never includes `updated_at` — no code path touches this column, regardless of whether values change. Not an anomaly |
| 7 | No duplicate/corrupt team records | `Content-Range: 0-2/3` — exactly 3 team rows, unchanged |
| 8 | RLS/RBAC still enforced | Anon read `audit_log` → `[]` (admin-only, re-confirmed this pass) |
| 9 | No unrelated production data changed | Only `x` and `p` show any audit activity (the underlying writes were no-ops per #5); team `t` untouched |
| 10 | Staging / denylisted project untouched | Staging (`bugqhoktzzdvduzfjctm`) `ACTIVE_HEALTHY`, unaffected; denylisted (`wmamuqylqqikvseuqerm`) `INACTIVE`, unaffected |

No corrective mutation was performed — the resulting state was already clean and none was required.

## Status: PASS, with the above deviation documented

The full authorization/audit chain is proven end-to-end through a real, non-fabricated production session: real login → `/admin` authorization → real Server Action execution (twice) → real, correctly-attributed `audit_log` entries → no privilege, data, or cross-project regression. The **First Real Admin gate is CLOSED as PASS**, with the two-click deviation and the entity-identity discrepancy recorded exactly as observed above, per explicit instruction not to normalize the evidence.
