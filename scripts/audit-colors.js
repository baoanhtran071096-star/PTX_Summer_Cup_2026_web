#!/usr/bin/env node
// ============================================================
// Design Token Audit Gate (docs/architecture §14, §4 Rule 4).
// Fails if any src/components|features file contains a raw hex
// color or rgb()/rgba() literal instead of a var(--...) token.
// src/design-system/** is exempt (it's where primitives are defined).
//
// Usage: node scripts/audit-colors.js
// ============================================================

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SCAN_DIRS = ['components', 'features', 'app'].map((d) => path.join(ROOT, 'src', d));

const HEX_COLOR = /#[0-9a-fA-F]{3,8}\b/g;
const RGB_COLOR = /\brgba?\([^)]*\)/g;

function walkFiles(dir) {
    if (!fs.existsSync(dir)) return [];
    let results = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            results = results.concat(walkFiles(full));
        } else if (/\.(ts|tsx|css)$/.test(entry.name)) {
            results.push(full);
        }
    }
    return results;
}

function main() {
    const violations = [];
    for (const dir of SCAN_DIRS) {
        for (const file of walkFiles(dir)) {
            const content = fs.readFileSync(file, 'utf8');
            const lines = content.split('\n');
            lines.forEach((line, idx) => {
                if (/^\s*\/\//.test(line) || /^\s*\*/.test(line)) return; // skip comment lines
                const hexMatches = line.match(HEX_COLOR);
                const rgbMatches = line.match(RGB_COLOR);
                if (hexMatches || rgbMatches) {
                    violations.push({
                        file: path.relative(ROOT, file),
                        line: idx + 1,
                        content: line.trim(),
                    });
                }
            });
        }
    }

    if (violations.length > 0) {
        console.error(`❌ Hardcoded color violations: ${violations.length} (must use design-system semantic tokens instead)\n`);
        for (const v of violations) {
            console.error(`  ${v.file}:${v.line}\n    ${v.content}`);
        }
        process.exitCode = 1;
        return;
    }

    console.log('✅ Design token audit OK — no hardcoded colors found in components/features/app.');
}

main();
