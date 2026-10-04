# fix_rp.py
import re
with open('src/lib/readingProgress.js', 'r', encoding='utf-8') as f:
    content = f.read()
print('Current formatRelativeTime block:')
print(content[content.find('formatRelativeTime'):content.find('formatRelativeTime')+300])
