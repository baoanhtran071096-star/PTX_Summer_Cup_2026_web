#!/usr/bin/env node
// ============================================================
// M09 real asset upload. Reads docs/migration/r25-asset-manifest.json
// (produced by scripts/migrate-r25-assets.js) and uploads each local
// file to its mapped Supabase Storage bucket, using the service-role
// key (bulk admin seeding — one of the few legitimate service-role
// use cases per docs/architecture §9, not the default app write path).
//
// Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in the
// environment.
//
// Usage: node scripts/upload-r25-media.js
// ============================================================

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const ROOT = path.resolve(__dirname, '..');
const MANIFEST_PATH = path.join(ROOT, 'docs', 'migration', 'r25-asset-manifest.json');

const MIME_TYPES = { '.webp': 'image/webp', '.mp4': 'video/mp4', '.png': 'image/png', '.jpg': 'image/jpeg' };

// M12.5 resolved decision (docs/migration/r25-approved-deprecation-registry.md
// entry #7): the source filename "Nguyễn Sử.webp" is the error — the
// player's correct name is "Xuân Sử". Correct the target key/caption at
// upload time rather than propagating the wrong name into Storage.
const TARGET_KEY_CORRECTIONS = {
    'player-avatars/nguyen-su.webp': { targetKey: 'xuan-su.webp', captionSource: 'Xuân Sử' },
};

function applyCorrections(file) {
    const lookupKey = `${file.bucket}/${file.targetKey}`;
    const correction = TARGET_KEY_CORRECTIONS[lookupKey];
    if (!correction) return file;
    return { ...file, ...correction };
}

async function main() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceRoleKey) {
        console.error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY — cannot upload. See .env.example.');
        process.exitCode = 1;
        return;
    }

    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
    const client = createClient(url, serviceRoleKey);

    let uploaded = 0;
    let failed = 0;
    const results = [];
    for (const rawFile of manifest.files) {
        const file = applyCorrections(rawFile);
        const absPath = path.join(ROOT, rawFile.sourcePath);
        const ext = path.extname(absPath).toLowerCase();
        const buffer = fs.readFileSync(absPath);
        const { error } = await client.storage
            .from(file.bucket)
            .upload(file.targetKey, buffer, { contentType: MIME_TYPES[ext] || 'application/octet-stream', upsert: true });
        if (error) {
            console.error(`FAILED ${file.bucket}/${file.targetKey}: ${error.message}`);
            failed++;
        } else {
            uploaded++;
            results.push({ bucket: file.bucket, targetKey: file.targetKey, sourcePath: rawFile.sourcePath, captionSource: file.captionSource });
        }
    }

    console.log(`Uploaded ${uploaded}/${manifest.files.length} files (${failed} failed).`);
    if (failed > 0) process.exitCode = 1;

    const outArg = process.argv.find((a) => a.startsWith('--out='));
    if (outArg) {
        const outPath = path.resolve(ROOT, outArg.slice('--out='.length));
        fs.mkdirSync(path.dirname(outPath), { recursive: true });
        fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf8');
        console.log(`Wrote upload result manifest to ${path.relative(ROOT, outPath)}`);
    }
}

main();
