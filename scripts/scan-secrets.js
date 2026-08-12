#!/usr/bin/env node
// ============================================================
// Secret Scanning Gate (M12 / roadmap Part II §5).
// Scans every git-tracked file for common secret patterns. Not a
// substitute for a dedicated tool (gitleaks/trufflehog) in CI long
// term, but a real, functioning gate rather than a stub.
//
// Usage: node scripts/scan-secrets.js
// Exit code 1 on any match (CI gate).
// ============================================================

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const PATTERNS = [
    { name: 'Generic API key assignment', re: /['"]?[A-Za-z0-9_]*api[_-]?key['"]?\s*[:=]\s*['"][A-Za-z0-9_\-/.+=]{20,}['"]/gi },
    { name: 'AWS Access Key ID', re: /AKIA[0-9A-Z]{16}/g },
    { name: 'Private key block', re: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/g },
    { name: 'Supabase service_role JWT (real, not placeholder)', re: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/g },
    { name: 'Generic bearer token assignment', re: /['"]?(secret|token|password)['"]?\s*[:=]\s*['"][A-Za-z0-9_\-/.+=]{20,}['"]/gi },
];

// Known-safe placeholder tokens that would otherwise match (e.g. .env.example, docs).
const ALLOWLIST_SUBSTRINGS = [
    'your-anon-key',
    'your-service-role-key',
    'your-ai-provider-api-key',
    'doi-chuoi-nay-thanh-chuoi-ngau-nhien-dai-truoc-khi-deploy',
    'doi-mat-khau-nay-truoc-khi-deploy',
    // R25 legacy Firebase Web API key (index.html PTX_FIREBASE_CONFIG).
    // Firebase Web API keys are designed by Google to be public/client-
    // exposed — access control comes from Firestore security rules and
    // key restrictions, not secrecy (unlike a service-role key or DB
    // password). Already documented as a known, intentional
    // characteristic of the frozen legacy baseline, not a new leak:
    // docs/legacy/r25-data-inventory.md §2. index.html is the immutable
    // M-01 baseline and is not edited to "fix" this.
    'AIzaSyCrcIgeykvz5CVA1oAdE9oRfs0np7UCrL0',
];

function listTrackedFiles() {
    const output = execSync('git ls-files', { cwd: ROOT, encoding: 'utf8' });
    return output.split('\n').filter(Boolean);
}

function main() {
    const files = listTrackedFiles();
    const findings = [];

    for (const relPath of files) {
        const absPath = path.join(ROOT, relPath);
        if (!fs.existsSync(absPath) || fs.statSync(absPath).isDirectory()) continue;
        // Skip binary-ish media — pattern matching on them is meaningless and slow.
        if (/\.(webp|mp4|png|jpe?g|ico|woff2?|zip)$/i.test(relPath)) continue;

        let content;
        try {
            content = fs.readFileSync(absPath, 'utf8');
        } catch {
            continue; // binary file, unreadable as utf8 — skip
        }

        for (const pattern of PATTERNS) {
            const matches = content.match(pattern.re);
            if (!matches) continue;
            for (const match of matches) {
                if (ALLOWLIST_SUBSTRINGS.some((safe) => match.includes(safe))) continue;
                findings.push({ file: relPath, pattern: pattern.name, match: match.slice(0, 80) });
            }
        }
    }

    if (findings.length > 0) {
        console.error(`❌ Potential secrets found: ${findings.length}\n`);
        for (const f of findings) {
            console.error(`  ${f.file} [${f.pattern}]\n    ${f.match}`);
        }
        process.exitCode = 1;
        return;
    }

    console.log(`✅ Secret scan OK — ${files.length} tracked files scanned, 0 findings.`);
}

main();
