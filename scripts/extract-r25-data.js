#!/usr/bin/env node
// ============================================================
// M-02 dry-run extraction tool.
// Reads the LIVE index.html + ptx_migration_data.json (legacy R25 sources)
// and produces a normalized, target-shaped JSON manifest of everything
// that would be inserted into the new Postgres schema — without touching
// any database. Safe to run repeatedly; writes nothing back to the source.
//
// Usage:
//   node scripts/extract-r25-data.js
//   node scripts/extract-r25-data.js --out=docs/migration/r25-extracted.json
// ============================================================

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const INDEX_HTML = path.join(ROOT, 'index.html');
const MIGRATION_JSON = path.join(ROOT, 'ptx_migration_data.json');

function extractBalanced(source, marker) {
    const startIdx = source.indexOf(marker);
    if (startIdx === -1) throw new Error(`Marker not found: ${marker}`);
    let i = startIdx + marker.length;
    while (source[i] !== '{' && source[i] !== '[') i++;
    const open = source[i];
    const close = open === '{' ? '}' : ']';
    let depth = 0;
    const start = i;
    for (; i < source.length; i++) {
        if (source[i] === open) depth++;
        else if (source[i] === close) {
            depth--;
            if (depth === 0) { i++; break; }
        }
    }
    return source.slice(start, i);
}

function evalLiteral(literalText) {
    // Legacy objects use unquoted keys / JS literal syntax (not strict JSON),
    // so we evaluate as a JS expression in an isolated Function scope rather
    // than JSON.parse. No legacy code is executed — only a single object/array
    // literal expression.
    return new Function(`"use strict"; return (${literalText});`)();
}

function main() {
    const html = fs.readFileSync(INDEX_HTML, 'utf8');

    const teamsLiteral = extractBalanced(html, 'const TEAMS_DATA =');
    const playersLiteral = extractBalanced(html, 'const PLAYERS_DATA =');
    const matchesLiteral = extractBalanced(html, 'const MATCHES_CONFIG =');

    const baseDateMatch = html.match(/baseDate\s*=\s*new Date\('([^']+)'\)/);
    if (!baseDateMatch) throw new Error('baseDate not found — legacy match-date anchor missing, do not guess a default.');
    const baseDate = baseDateMatch[1];

    const teamsRaw = evalLiteral(teamsLiteral);
    const playersRaw = evalLiteral(playersLiteral);
    const matchesRaw = evalLiteral(matchesLiteral);

    const migrationJson = JSON.parse(fs.readFileSync(MIGRATION_JSON, 'utf8'));

    // --- Target-shaped rows -------------------------------------------------

    const teams = Object.values(teamsRaw).map(t => ({
        legacy_id: t.id,
        name: t.name,
        full_name: t.fullName,
        icon: t.icon,
        color: t.color,
        captain_name: t.captain,
        stats: t.stats,
        ovr: t.ovr,
        logo_source_path: t.logo || null,
    }));

    const players = playersRaw.map(p => ({
        legacy_id: p.id,
        name: p.name,
        team_legacy_id: p.team,
        position: p.position,
        avatar_source_path: p.avatar,
        // goals/assists/mvp intentionally NOT carried as mutable columns —
        // target computes these from match_events (see r25-data-reconciliation-plan.md §3).
        legacy_static_goals: p.goals,
        legacy_static_assists: p.assists,
        legacy_static_mvp: p.mvp,
        flags: p.id === 18
            ? ['NAME_ASSET_MISMATCH: display name "Xuân Sử" vs avatar filename "Nguyễn Sử.webp" — resolve with product owner before final import']
            : [],
    }));

    const matches = matchesRaw.map(m => ({
        legacy_id: m.id,
        home_team_legacy_id: m.home,
        away_team_legacy_id: m.away,
        match_date: baseDate,
        start_time: `${String(m.startH).padStart(2, '0')}:${String(m.startM).padStart(2, '0')}`,
        end_time: `${String(m.endH).padStart(2, '0')}:${String(m.endM).padStart(2, '0')}`,
        // No result/event data migrated here — see extract-r25-match-events.js
        // for parsing ptx_result_* strings once a live export is available.
    }));

    const settingsBlock = migrationJson.localStorage || {};
    const tournamentSettings = {
        slogan: settingsBlock.ptx_slogan ?? null,
        message: settingsBlock.ptx_msg ?? null,
        event_date: settingsBlock.ptx_date ?? null,
        location: settingsBlock.ptx_location ?? null,
    };

    const hallOfFame = Object.entries(settingsBlock)
        .filter(([k]) => k.startsWith('hof_'))
        .map(([k, v]) => {
            const year = Number(k.slice(4));
            const parts = String(v).split('|').map(s => s.trim());
            const isPlaceholder = (s) => !s || s.startsWith('Chưa đủ dữ liệu');
            return {
                year,
                champion: isPlaceholder(parts[0]) ? null : parts[0],
                runner_up: isPlaceholder(parts[1]) ? null : parts[1],
                third_place: isPlaceholder(parts[2]) ? null : parts[2],
                golden_boot: isPlaceholder(parts[3]) ? null : parts[3],
                mvp: isPlaceholder(parts[4]) ? null : parts[4],
                note: 'champion/runner_up/third_place stored as free text here pending name-to-team_id resolution at import time',
            };
        });

    const galleryOverrides = Object.entries(settingsBlock)
        .filter(([k]) => k.startsWith('gallery_'))
        .flatMap(([k, v]) => {
            const year = Number(k.slice(8));
            const urls = String(v).split('|').map(s => s.trim()).filter(Boolean);
            const categories = ['opening', 'matchday', 'awards'];
            return urls.map((url, idx) => ({
                year,
                category: categories[idx] || `slot-${idx}`,
                source_url: url,
                external: /^https?:\/\//.test(url),
            }));
        });

    const externalAssetWarnings = galleryOverrides
        .filter(g => g.external)
        .map(g => `Gallery ${g.year}/${g.category} still hotlinked: ${g.source_url}`);

    const manifest = {
        extractedAt: '(set at run time by consumer — Date.now() intentionally not embedded by this script)',
        sourceFiles: {
            indexHtml: path.relative(ROOT, INDEX_HTML),
            migrationJson: path.relative(ROOT, MIGRATION_JSON),
        },
        counts: {
            teams: teams.length,
            players: players.length,
            matches: matches.length,
            hallOfFameYears: hallOfFame.length,
            galleryOverrideItems: galleryOverrides.length,
        },
        warnings: [
            ...players.flatMap(p => p.flags),
            ...externalAssetWarnings,
            'This extraction reflects the CURRENT working copy of index.html + ptx_migration_data.json at run time. ptx_migration_data.json is a point-in-time export (2026-07-30) — re-run this script against a FRESH export/live admin state immediately before actual cutover, per r25-data-reconciliation-plan.md §5.',
        ],
        teams,
        players,
        matches,
        tournamentSettings,
        hallOfFame,
        galleryOverrides,
    };

    const outArg = process.argv.find(a => a.startsWith('--out='));
    const outPath = outArg
        ? path.resolve(ROOT, outArg.slice('--out='.length))
        : null;

    const json = JSON.stringify(manifest, null, 2);
    if (outPath) {
        fs.mkdirSync(path.dirname(outPath), { recursive: true });
        fs.writeFileSync(outPath, json, 'utf8');
        console.log(`Wrote extraction manifest to ${path.relative(ROOT, outPath)}`);
        console.log(`Counts: ${JSON.stringify(manifest.counts)}`);
        if (manifest.warnings.length) {
            console.log(`\n${manifest.warnings.length} warning(s):`);
            manifest.warnings.forEach(w => console.log(`  - ${w}`));
        }
    } else {
        console.log(json);
    }
}

main();
