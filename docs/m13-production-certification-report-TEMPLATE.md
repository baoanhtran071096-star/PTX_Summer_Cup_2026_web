# Production Deployment Evidence / Production Certification Report

> **This is a template.** Every field below is `PENDING` because production has not been deployed to. Do not fill in any field with a fabricated or assumed value — each must be populated only after the corresponding real command/check has actually been run against production, following `docs/m13-production-deployment-plan.md`. Copy this file to `docs/m13-production-certification-report.md` (drop `-TEMPLATE`) when real execution begins, and fill it in as each step actually completes — not retroactively reconstructed from memory afterward.

## Deployment identity

- **Deployed commit SHA:** PENDING
- **Deployed by / authorized by (product owner name/role):** PENDING
- **Production GO authorization timestamp:** PENDING
- **Production project ref (confirmed, matches `docs/m13-production-deployment-plan.md` §0.1):** PENDING
- **Deployment start / end timestamp:** PENDING

## §0 Decisions locked before deployment (copy the final locked values from the deployment plan)

- Production ref: PENDING
- Backup/DR strategy chosen (a: PITR / b: alternative) and RPO/RTO: PENDING
- Seed policy sign-off: PENDING
- Team T/X asset decision (unchanged / updated with new photos): PENDING

## Preflight Gate (§1) — result per row

| # | Check | Result |
|---|---|---|
| 1 | Git state / commit SHA | PENDING |
| 2 | Production ref confirmed + blocklist check | PENDING |
| 3 | Migration history check | PENDING |
| 4 | Environment variables check | PENDING |
| 5 | Secret scan (pre-deploy) | PENDING |
| 6 | Backup/recovery readiness | PENDING |
| 7 | Rollback prerequisites | PENDING |

## Migration state (§3)

- Migrations applied: PENDING (list exact filenames + timestamps from `supabase migration list --linked`)
- Any failures encountered / remediation: PENDING

## Seed / Data Parity (§5)

- `verify-data-parity.js` result: PENDING
- Any deprecation-registry exceptions recorded: PENDING

## Storage (§6)

- Buckets provisioned: PENDING
- Upload result (files/failed count): PENDING
- Real fetch verification (URLs + status codes): PENDING

## Auth / RBAC (§7)

- First real admin: created / promoted — PENDING
- Full chain verified (signup→profile→login→JWT→role→admin write→audit log): PENDING
- Anon/user/admin RLS matrix result: PENDING

## Realtime (§8)

- Test mutation + event + revert result: PENDING
- Confirmed no test artifact left behind: PENDING

## Full Production Certification Gate (§10)

| Category | Result |
|---|---|
| Pre-deploy static gates (typecheck/lint/architecture/tokens/secrets/unit/build) | PENDING |
| Post-deploy read-only gates (accessibility, parity, RLS) | PENDING |
| Post-deploy revert-required gates (Realtime, admin write) | PENDING |

## Post-Deployment Smoke Test (§11)

| Area | Result |
|---|---|
| Homepage | PENDING |
| Navigation | PENDING |
| Teams | PENDING |
| Players | PENDING |
| Matches | PENDING |
| Standings | PENDING |
| Predictions | PENDING |
| Authentication | PENDING |
| Admin critical paths | PENDING |
| Assets | PENDING |
| API/DB connectivity | PENDING |

## Observability (§12)

| Log source | Findings |
|---|---|
| Postgres | PENDING |
| PostgREST/API | PENDING |
| Auth | PENDING |
| Storage | PENDING |
| Realtime | PENDING |
| Application (browser/server errors) | PENDING |

## Exceptions / known gaps carried forward

- PENDING (e.g. Team T/X photos still `SOURCE_LOST_PENDING_REPLACEMENT`, any deprecation-registry entries, any accepted risk from §0.2(b))

## Rollback readiness confirmation

- Rollback procedure re-validated against the live production project: PENDING
- Any rollback actually invoked during this deployment: PENDING (describe, or state "none")

## Automatic stop conditions encountered

- PENDING (list any that fired, or state "none")

## Conclusion

**PASS / FAIL:** PENDING

**Certified by:** PENDING
**Date:** PENDING
