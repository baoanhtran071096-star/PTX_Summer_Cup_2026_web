#!/usr/bin/env node
// ============================================================
// M12.5: after scripts/upload-r25-media.js runs for real, this
// updates players.avatar_path / teams.logo_path with the actual
// uploaded Storage object keys (seed.sql intentionally left these
// NULL — see supabase/seed.sql header — since no upload had happened
// yet). Matches by decoded basename between the extraction manifest
// and the upload-result manifest.
//
// Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
// Usage: node --env-file=.env scripts/apply-uploaded-media-paths.js
// ============================================================

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const ROOT = path.resolve(__dirname, '..');

function basenameNoExt(p) {
    return path.basename(p).replace(/\.[^.]+$/, '');
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
    const uploadResult = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/migration/r25-upload-result.json'), 'utf8'));
    const client = createClient(url, serviceRoleKey);

    const playerUploads = uploadResult.filter((u) => u.bucket === 'player-avatars');
    const teamUploads = uploadResult.filter((u) => u.bucket === 'team-logos');

    let playerUpdates = 0;
    let unmatchedPlayers = [];
    for (const p of extracted.players) {
        if (!p.avatar_source_path) continue;
        const wanted = basenameNoExt(p.avatar_source_path);
        const match = playerUploads.find((u) => basenameNoExt(decodeURIComponent(u.sourcePath)) === wanted);
        if (!match) {
            unmatchedPlayers.push({ legacy_id: p.legacy_id, name: p.name, wanted });
            continue;
        }
        const { error } = await client.from('players').update({ avatar_path: match.targetKey }).eq('legacy_id', p.legacy_id);
        if (error) throw new Error(`Failed updating player ${p.legacy_id}: ${error.message}`);
        playerUpdates++;
    }

    let teamUpdates = 0;
    let unmatchedTeams = [];
    for (const t of extracted.teams) {
        if (!t.logo_source_path) continue;
        const wanted = basenameNoExt(decodeURIComponent(t.logo_source_path));
        const match = teamUploads.find((u) => basenameNoExt(decodeURIComponent(u.sourcePath)) === wanted);
        if (!match) {
            unmatchedTeams.push({ legacy_id: t.legacy_id, name: t.name, wanted });
            continue;
        }
        const { error } = await client.from('teams').update({ logo_path: match.targetKey }).eq('id', t.legacy_id);
        if (error) throw new Error(`Failed updating team ${t.legacy_id}: ${error.message}`);
        teamUpdates++;
    }

    console.log(`Updated ${playerUpdates}/${extracted.players.length} player avatar_path values.`);
    console.log(`Updated ${teamUpdates}/${extracted.teams.length} team logo_path values.`);
    if (unmatchedPlayers.length) console.log('Unmatched players:', JSON.stringify(unmatchedPlayers, null, 2));
    if (unmatchedTeams.length) console.log('Unmatched teams:', JSON.stringify(unmatchedTeams, null, 2));
}

main();
