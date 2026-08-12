# R25 Authentication Transition Plan

> **Module:** M-02 — Extraction & Migration Mapping
> **Source:** `docs/legacy/r25-state-inventory.md` §2 (M-01, frozen).

## 1. Legacy mechanism (being replaced, not ported)

- Single hardcoded admin identity: `ptx_admin_user`/`ptx_admin_hash`/`ptx_salt` in localStorage, default `admin`/`ptx2026` seeded by `initAdminAccount()` (index.html:6741-6753).
- Password hashing: SHA-256(salt + password) via Web Crypto, salt from `Math.random()+Date.now()` (not cryptographically strong).
- No server-side verification at all for the base product — the only server-side gate is Firestore's `request.auth != null` rule on `tournamentState` writes, which uses a **separate** Firebase Email/Password identity (`pseudoEmailFor(username)` → `<username>@ptxsummercup.internal`), created manually per `PHASE2_FIREBASE_SETUP.md` Step 3.
- Login lockout: 5 failed attempts → 5-minute lockout, purely client-side (localStorage timestamps), trivially bypassable by clearing localStorage.
- `reset-admin.html`: standalone static recovery page gated by a hashed recovery phrase, explicitly documented as "reinforcement, not absolute security."

**None of this is cryptographically sound by modern standards**, and the directive is explicit that migration is not an excuse to carry forward known-weak security mechanisms. This is a full REPLACE, not a port.

## 2. Target mechanism

- **Supabase Auth**, email/password provider (matches the legacy provider choice conceptually, minimizing UX change for the one real admin user).
- `profiles` table: `id uuid references auth.users(id)`, `username`, `display_name`, `role text check (role in ('admin','viewer')) default 'viewer'`.
- Exactly **one** admin profile is provisioned at cutover (matching the legacy single-admin reality) — the `profiles.role` design supports more admins later without a schema change, satisfying Architecture v1.3's more general RBAC intent without over-building UI for a multi-admin scenario that doesn't exist yet (YAGNI — do not build a user-invite system in M02 unless M-03/product owner scopes multi-admin for v1).
- Server-side authorization via **RLS policies keyed on `auth.uid()` + `profiles.role`**, not a client-side flag. Every admin-only write (teams/players/matches/match_events/hall_of_fame/gallery/tournament_settings) requires `role = 'admin'` under RLS — this is the real gate the legacy app never had.
- Public reads (schedule, standings, players, gallery, etc.) remain unauthenticated per Architecture v1.3 §9 default posture — RLS `allow select: true` on public-facing tables, matching the legacy Firestore rule's public-read intent but now with genuine per-table/per-column granularity instead of Firestore's single blanket collection rule.
- Rate limiting / lockout: use Supabase Auth's built-in mechanisms (or a server-side rate limit in a Server Action) rather than a client-localStorage-only lockout — this closes the "clear localStorage to bypass" hole.
- Recovery flow: replace the static `reset-admin.html` hashed-recovery-phrase page with Supabase Auth's standard password-reset-email flow (requires the admin's email address to be captured — confirm the organizer's real email during account provisioning, not a placeholder `@ptxsummercup.internal` pseudo-email).

## 3. Migration mechanics (there is no password data to migrate)

Because the legacy password hash scheme (custom salted SHA-256) is neither compatible with nor should be trusted by the new system, **the admin's password is not migrated** — a new Supabase Auth account is provisioned fresh for the tournament organizer, with a new password set directly by them (not carried over, not guessed, not defaulted to `ptx2026`). This is a deliberate, approved break in continuity of the *credential itself* while preserving continuity of *who has access* (the same person/role).

Action items before M02 (Auth+RBAC) implementation:
1. Confirm the real email address to use for the admin Supabase Auth account (do not reuse `admin@ptxsummercup.internal` — that was a Firebase-specific pseudo-email workaround, not a real inbox).
2. Have the organizer set a new password directly through Supabase Auth's flow at provisioning time — Claude/the implementation agent must not choose, generate, or store this password.
3. Decide whether the legacy default `admin` *username* is preserved as a `profiles.username`/display convenience, even though the auth identity itself is now email-based.

## 4. Firestore Auth retirement

The `ptxCloudSync` module's Firebase Auth usage (`signInWithEmailAndPassword` against a pseudo-email) is retired along with the rest of Firestore (per the source-to-target map — Firebase is fully superseded, not dual-run). No data migration needed here beyond the account-provisioning steps above, since Firestore Auth held no data of its own beyond the single sign-in credential already covered in §3.
