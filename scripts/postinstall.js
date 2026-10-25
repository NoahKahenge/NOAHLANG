#!/usr/bin/env node
// scripts/postinstall.js
// Runs after `npm install -g noahlang`.
// Copies Forge.noah and style.css to ~/.noahlang/lib/ so that
// `pull "Forge.noah"` works from any project directory.

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const userDir = process.env.NOAHLANG_HOME || path.join(os.homedir(), '.noahlang');
const libSource = path.join(__dirname, '..', 'lib');
const libDest = path.join(userDir, 'lib');

const files = ['Forge.noah', 'style.css'];

console.log('');
console.log('  NoahLang');
console.log('  ────────');
console.log('');

try {
    fs.mkdirSync(userDir, { recursive: true });
    fs.mkdirSync(libDest, { recursive: true });

    let copied = 0;
    for (const file of files) {
        const src = path.join(libSource, file);
        const dest = path.join(libDest, file);
        if (fs.existsSync(src)) {
            fs.copyFileSync(src, dest);
            console.log(`  ✓ ${file} → ${dest}`);
            copied++;
        } else {
            console.log(`  ⚠ ${file} not found in package (skipped)`);
        }
    }

    console.log('');
    console.log(`  Installed ${copied} file(s) to ${libDest}`);
    console.log('');
    console.log('  Try it:');
    console.log('    noah --version');
    console.log('    echo \'write "Hello, world!"\' > hello.noah');
    console.log('    noah hello.noah');
    console.log('');
    console.log('  For web pages:');
    console.log('    pull "Forge.noah"');
    console.log('    page("My Site")');
    console.log('    head1("Welcome")');
    console.log('    done()');
    console.log('    serve(3000)');
    console.log('');
    console.log('  Docs: https://github.com/NoahKahenge/noahlang-debugger');
    console.log('');
} catch (err) {
    console.warn('');
    console.warn(`  [noah] postinstall warning: ${err.message}`);
    console.warn('  [noah] You may need to create ~/.noahlang/lib/ manually.');
    console.warn('  [noah] Or set NOAHLANG_HOME to a writable directory.');
    console.warn('');
    // Don't fail the install — just warn.
    // A failed postinstall can leave npm in a broken state.
    process.exit(0);
}