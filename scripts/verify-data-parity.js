#!/usr/bin/env node
// ============================================================
// M12.5: verifies the live seeded database matches the frozen M-02
// extraction manifest (docs/migration/r25-extracted.json) exactly —
// teams, players, matches. Read-only; exits non-zero on any mismatch.
//
// Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
// Usage: node --env-file=.env scripts/verify-data-parity.js
// ============================================================

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const ROOT = path.resolve(__dirname, '..');

function diff(label, expected, actual) {
    if (expected === actual) return null;
    return `${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`;
}

async function main() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceRoleKey) {
        console.error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.');
        process.exitCode = 1;
        return;
    }

    const extracted = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/migration/r25-extracted.json'), 'utf8'));
    const client = createClient(url, serviceRoleKey);
    const mismatches = [];

    const { data: teams, error: teamsError } = await client.from('teams').select('*').order('id');
    if (teamsError) throw teamsError;
    mismatches.push(diff('teams count', extracted.teams.length, teams.length));
    for (const expectedTeam of extracted.teams) {
        const actual = teams.find((t) => t.id === expectedTeam.legacy_id);
        if (!actual) {
            mismatches.push(`team ${expectedTeam.legacy_id}: missing from DB`);
            continue;
        }
        mismatches.push(diff(`team ${expectedTeam.legacy_id} name`, expectedTeam.name, actual.name));
        mismatches.push(diff(`team ${expectedTeam.legacy_id} full_name`, expectedTeam.full_name, actual.full_name));
        mismatches.push(diff(`team ${expectedTeam.legacy_id} icon`, expectedTeam.icon, actual.icon));
        mismatches.push(diff(`team ${expectedTeam.legacy_id} ovr`, expectedTeam.ovr, actual.ovr));
        mismatches.push(diff(`team ${expectedTeam.legacy_id} captain_name`, expectedTeam.captain_name, actual.captain_name));
        for (const stat of ['attack', 'defense', 'speed', 'power']) {
            mismatches.push(diff(`team ${expectedTeam.legacy_id} stats.${stat}`, expectedTeam.stats[stat], actual.stats?.[stat]));
        }
    }

    const { data: players, error: playersError } = await client.from('players').select('*').order('legacy_id');
    if (playersError) throw playersError;
    mismatches.push(diff('players count', extracted.players.length, players.length));
    for (const expectedPlayer of extracted.players) {
        const actual = players.find((p) => p.legacy_id === expectedPlayer.legacy_id);
        if (!actual) {
            mismatches.push(`player ${expectedPlayer.legacy_id}: missing from DB`);
            continue;
        }
        mismatches.push(diff(`player ${expectedPlayer.legacy_id} name`, expectedPlayer.name, actual.name));
        mismatches.push(diff(`player ${expectedPlayer.legacy_id} team_id`, expectedPlayer.team_legacy_id, actual.team_id));
        mismatches.push(diff(`player ${expectedPlayer.legacy_id} position`, expectedPlayer.position, actual.position));
    }

    const { data: matches, error: matchesError } = await client.from('matches').select('*').order('legacy_id');
    if (matchesError) throw matchesError;
    mismatches.push(diff('matches count', extracted.matches.length, matches.length));
    for (const expectedMatch of extracted.matches) {
        const actual = matches.find((m) => m.legacy_id === expectedMatch.legacy_id);
        if (!actual) {
            mismatches.push(`match ${expectedMatch.legacy_id}: missing from DB`);
            continue;
        }
        mismatches.push(diff(`match ${expectedMatch.legacy_id} home_team_id`, expectedMatch.home_team_legacy_id, actual.home_team_id));
        mismatches.push(diff(`match ${expectedMatch.legacy_id} away_team_id`, expectedMatch.away_team_legacy_id, actual.away_team_id));
        mismatches.push(diff(`match ${expectedMatch.legacy_id} match_date`, expectedMatch.match_date, actual.match_date));
    }

    const real = mismatches.filter(Boolean);
    if (real.length === 0) {
        console.log(`PARITY OK — teams ${teams.length}/${extracted.teams.length}, players ${players.length}/${extracted.players.length}, matches ${matches.length}/${extracted.matches.length}.`);
    } else {
        console.log(`PARITY MISMATCHES (${real.length}):`);
        for (const m of real) console.log(` - ${m}`);
        process.exitCode = 1;
    }
}

main();
