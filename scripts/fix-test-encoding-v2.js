#!/usr/bin/env node
/**
 * Fix encoding issues in the test file:
 * - Replace curly quotes with straight quotes (only)
 * - Remove carriage returns
 */

const fs = require('fs');
const path = require('path');

const testFile = path.join(__dirname, '..', 'tests', 'e2e', 'stage-gather-scrape.test.ts.broken');
const outputFile = path.join(__dirname, '..', 'tests', 'e2e', 'stage-gather-scrape.test.ts');

console.log('Fixing encoding issues in:', testFile);

// Read the file as buffer to handle binary data properly
let content = fs.readFileSync(testFile, 'utf8');

// Replace curly quotes with straight quotes - these are the problematic ones
content = content.replace(/'/g, "'");  // U+2018 LEFT SINGLE QUOTATION MARK → U+0027 APOSTROPHE
content = content.replace(/'/g, "'");  // U+2019 RIGHT SINGLE QUOTATION MARK → U+0027 APOSTROPHE
content = content.replace(/"/g, '"');  // U+201C LEFT DOUBLE QUOTATION MARK → U+0022 QUOTATION MARK
content = content.replace(/"/g, '"');  // U+201D RIGHT DOUBLE QUOTATION MARK → U+0022 QUOTATION MARK

// Remove carriage returns (Windows line endings)
content = content.replace(/\r\n/g, '\n');
content = content.replace(/\r/g, '\n');

// Fix the checkmark replacements back to spaces (undo previous bad fix)
// This is a heuristic - looking for patterns that are clearly wrong
content = content.replace(/import✓\*✓as✓/g, 'import * as ');
content = content.replace(/✓from✓/g, ' from ');
content = content.replace(/\/\/✓❌oad✓environment✓variables✓from✓\.env✓file/g, '// Load environment variables from .env file');
content = content.replace(/dotenv\.config\(\);/g, 'dotenv.config();');

// More generic cleanup - restore spaces in import statements
content = content.replace(/import✓/g, 'import ');
content = content.replace(/as✓/g, 'as ');
content = content.replace(/from✓'/g, " from '");

// Restore spaces around common keywords
const keywords = ['const', 'let', 'var', 'function', 'async', 'await', 'return', 'if', 'else', 'for', 'while', 'class', 'interface', 'type', 'export', 'import', 'new', 'this', 'true', 'false', 'null', 'undefined'];
keywords.forEach(keyword => {
  const regex1 = new RegExp(`✓${keyword}✓`, 'g');
  const regex2 = new RegExp(`✓${keyword}`, 'g');
  const regex3 = new RegExp(`${keyword}✓`, 'g');
  content = content.replace(regex1, ` ${keyword} `);
  content = content.replace(regex2, ` ${keyword}`);
  content = content.replace(regex3, `${keyword} `);
});

// Restore spaces in common patterns
content = content.replace(/✓=✓/g, ' = ');
content = content.replace(/✓\+✓/g, ' + ');
content = content.replace(/✓-✓/g, ' - ');
content = content.replace(/✓\*✓/g, ' * ');
content = content.replace(/✓\/✓/g, ' / ');
content = content.replace(/✓<✓/g, ' < ');
content = content.replace(/✓>✓/g, ' > ');
content = content.replace(/✓\?✓/g, ' ? ');
content = content.replace(/✓:✓/g, ' : ');
content = content.replace(/✓&&✓/g, ' && ');
content = content.replace(/✓\|\|✓/g, ' || ');
content = content.replace(/\(✓/g, '(');
content = content.replace(/✓\)/g, ')');
content = content.replace(/\{✓/g, '{ ');
content = content.replace(/✓\}/g, ' }');
content = content.replace(/\[✓/g, '[');
content = content.replace(/✓\]/g, ']');
content = content.replace(/,✓/g, ', ');
content = content.replace(/;✓/g, '; ');
content = content.replace(/✓\./g, '.');
content = content.replace(/\.✓/g, '. ');

// This is getting too complex. Let me just restore from a clean copy.
// Actually, the file wasn't in git, so let me ask user for the original

console.log('Warning: File was corrupted by previous fix attempt.');
console.log('Need to recreate the file from scratch or find backup.');

// Write what we have for now
fs.writeFileSync(outputFile, content, 'utf8');
console.log('Partial fix written to:', outputFile);
console.log('Manual review and fixes may be needed.');
