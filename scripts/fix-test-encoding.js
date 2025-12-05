#!/usr/bin/env node
/**
 * Fix encoding issues in the test file:
 * - Replace curly quotes with straight quotes
 * - Remove carriage returns
 * - Fix corrupted emoji characters
 */

const fs = require('fs');
const path = require('path');

const testFile = path.join(__dirname, '..', 'tests', 'e2e', 'stage-gather-scrape.test.ts');

console.log('Fixing encoding issues in:', testFile);

// Read the file
let content = fs.readFileSync(testFile, 'utf8');

// Replace curly quotes with straight quotes
content = content.replace(/'/g, "'");  // LEFT SINGLE QUOTATION MARK
content = content.replace(/'/g, "'");  // RIGHT SINGLE QUOTATION MARK
content = content.replace(/"/g, '"');  // LEFT DOUBLE QUOTATION MARK
content = content.replace(/"/g, '"');  // RIGHT DOUBLE QUOTATION MARK

// Remove carriage returns
content = content.replace(/\r/g, '');

// Fix corrupted emoji characters (replace with proper emojis)
content = content.replace(/�/g, '⚠️');
content = content.replace(/=/g, '📋');
content = content.replace(/</g, '🔍');
content = content.replace(/>/g, '🧹');
content = content.replace(/ /g, '✓');
content = content.replace(/9/g, '📊');
content = content.replace(/L/g, '❌');

// Write the file back
fs.writeFileSync(testFile, content, 'utf8');

console.log('✓ File fixed successfully');
