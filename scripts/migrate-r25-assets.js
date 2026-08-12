#!/usr/bin/env node
// ============================================================
// M-02 dry-run asset migration planner.
// Walks thư viện/ and produces a manifest mapping each local source file
// to its target Supabase Storage bucket/key, per r25-asset-migration-plan.md.
// Does NOT upload anything and does NOT require Supabase credentials —
// this is a planning artifact for M09 to execute against once the
// Supabase project/buckets exist.
//
// Usage:
//   node scripts/migrate-r25-assets.js --out=docs/migration/r25-asset-manifest.json
// ============================================================

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MEDIA_ROOT = path.join(ROOT, 'thư viện');

const FOLDER_TO_BUCKET = {
    'logo biểu tượng 3 đội': 'team-logos',
    'Ảnh cầu thủ': 'player-avatars',
    'đội cổ động viên': 'gallery',
    'Media': 'gallery',
    'Ảnh hậu cần': 'operations-media',
    'ảnh logo - banner': 'branding',
};

function slugifyKey(name) {
    // ASCII-safe object key; original Vietnamese name is preserved separately
    // as caption/alt-text metadata (see r25-asset-migration-plan.md §5), not lost.
    return name
        .normalize('NFD').replace(/[̀-ͯ]/g, '') // strip diacritics
        .replace(/đ/gi, 'd')
        .replace(/[^a-zA-Z0-9.\-_]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .toLowerCase();
}

function walk(dir, baseDir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    let files = [];
    for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files = files.concat(walk(full, baseDir));
        } else {
            files.push(full);
        }
    }
    return files;
}

function main() {
    if (!fs.existsSync(MEDIA_ROOT)) {
        throw new Error(`Media root not found: ${MEDIA_ROOT}`);
    }

    const allFiles = walk(MEDIA_ROOT, MEDIA_ROOT);
    const manifest = allFiles.map(absPath => {
        const relPath = path.relative(MEDIA_ROOT, absPath);
        const topFolder = relPath.split(path.sep)[0];
        const bucket = FOLDER_TO_BUCKET[topFolder] || 'unmapped';
        const fileName = path.basename(relPath);
        const stat = fs.statSync(absPath);
        return {
            sourcePath: path.join('thư viện', relPath),
            bucket,
            targetKey: slugifyKey(fileName),
            captionSource: fileName.replace(/\.[^.]+$/, ''),
            sizeBytes: stat.size,
        };
    });

    const unmapped = manifest.filter(m => m.bucket === 'unmapped');
    const byBucket = manifest.reduce((acc, m) => {
        acc[m.bucket] = (acc[m.bucket] || 0) + 1;
        return acc;
    }, {});

    const knownExternalDependencies = [
        { description: '3 team group-lineup photos (Team P/T/X) hotlinked from postimg.cc, no local file found', status: 'UNRESOLVED — requires manual download, see r25-asset-migration-plan.md §3' },
    ];

    const result = {
        totalLocalFiles: manifest.length,
        byBucket,
        unmappedCount: unmapped.length,
        knownExternalDependencies,
        files: manifest,
    };

    const outArg = process.argv.find(a => a.startsWith('--out='));
    const outPath = outArg
        ? path.resolve(ROOT, outArg.slice('--out='.length))
        : null;

    const json = JSON.stringify(result, null, 2);
    if (outPath) {
        fs.mkdirSync(path.dirname(outPath), { recursive: true });
        fs.writeFileSync(outPath, json, 'utf8');
        console.log(`Wrote asset manifest to ${path.relative(ROOT, outPath)}`);
        console.log(`Total local files: ${result.totalLocalFiles}`);
        console.log(`By bucket: ${JSON.stringify(byBucket)}`);
        if (unmapped.length) console.log(`⚠ ${unmapped.length} file(s) did not match a known folder mapping.`);
        console.log(`External dependencies still unresolved: ${knownExternalDependencies.length}`);
    } else {
        console.log(json);
    }
}

main();
