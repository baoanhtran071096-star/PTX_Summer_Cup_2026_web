#!/usr/bin/env node
// ============================================================
// Architecture Boundary Gate (docs/architecture §3, Rule 7).
// Enforces: DOMAIN -> NOTHING. Fails the build if src/domain/**
// imports React, Next.js, Supabase, browser APIs, CSS, or any
// services/components/features module.
//
// Also enforces: components/ must not import services/database
// directly (Rule 5 — data access must go through features/*).
//
// Usage: node scripts/verify-architecture.js
// Exit code 1 on any violation (CI gate).
// ============================================================

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');

const FORBIDDEN_IN_DOMAIN = [
    /from ['"]react['"]/,
    /from ['"]react-dom['"]/,
    /from ['"]next\//,
    /from ['"]next['"]/,
    /from ['"]@supabase\//,
    /from ['"]@\/services\//,
    /from ['"]@services\//,
    /from ['"]@\/components\//,
    /from ['"]@components\//,
    /from ['"]@\/design-system\//,
    /from ['"]@design\//,
    /\.css['"]/,
    /window\./,
    /document\./,
];

const FORBIDDEN_IN_COMPONENTS = [
    /from ['"]@supabase\//,
    /from ['"]@\/services\/database['"]/,
    /from ['"]@services\/database['"]/,
];

function walkTsFiles(dir) {
    if (!fs.existsSync(dir)) return [];
    let results = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            results = results.concat(walkTsFiles(full));
        } else if (/\.(ts|tsx)$/.test(entry.name)) {
            results.push(full);
        }
    }
    return results;
}

function checkFiles(files, patterns, label) {
    const violations = [];
    for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
            for (const pattern of patterns) {
                if (pattern.test(line)) {
                    violations.push({
                        file: path.relative(ROOT, file),
                        line: idx + 1,
                        content: line.trim(),
                        rule: label,
                    });
                }
            }
        });
    }
    return violations;
}

function main() {
    const domainFiles = walkTsFiles(path.join(SRC, 'domain'));
    const componentFiles = walkTsFiles(path.join(SRC, 'components'));

    const violations = [
        ...checkFiles(domainFiles, FORBIDDEN_IN_DOMAIN, 'domain -> nothing (Rule 7)'),
        ...checkFiles(componentFiles, FORBIDDEN_IN_COMPONENTS, 'components must not query Supabase directly (Rule 5)'),
    ];

    if (violations.length > 0) {
        console.error(`❌ Architecture boundary violations: ${violations.length}\n`);
        for (const v of violations) {
            console.error(`  ${v.file}:${v.line} [${v.rule}]\n    ${v.content}`);
        }
        process.exitCode = 1;
        return;
    }

    console.log(`✅ Architecture boundaries OK (${domainFiles.length} domain files, ${componentFiles.length} component files scanned)`);
}

main();
