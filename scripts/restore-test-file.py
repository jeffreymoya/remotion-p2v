#!/usr/bin/env python3
"""
Restore the test file by replacing checkmarks back to spaces
and fixing quote characters
"""

import re

# Read the broken file
with open('tests/e2e/stage-gather-scrape.test.ts.broken', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace all checkmarks (✓) and crosses (❌) that were wrongly substituted for spaces
content = content.replace('✓', ' ')
content = content.replace('❌', 'X')

# Replace emoji characters that were substituted for operators
content = content.replace('📋', '=')  # equals sign
content = content.replace('🔍', '<')  # left angle bracket
content = content.replace('🧹', '>')  # right angle bracket
content = content.replace('📊', '9')  # digit nine

# Replace curly quotes with straight quotes
content = content.replace(''', "'")  # LEFT SINGLE QUOTATION MARK
content = content.replace(''', "'")  # RIGHT SINGLE QUOTATION MARK
content = content.replace('"', '"')  # LEFT DOUBLE QUOTATION MARK
content = content.replace('"', '"')  # RIGHT DOUBLE QUOTATION MARK

# Remove carriage returns
content = content.replace('\r\n', '\n')
content = content.replace('\r', '\n')

# Fix multiple spaces (keep reasonable spacing)
content = re.sub(r'   +', '  ', content)  # Normalize 3+ spaces to double space

# Write the restored file
with open('tests/e2e/stage-gather-scrape.test.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print('✓ File restored successfully')
