const fs = require('fs');
const path = require('path');

function getAllFiles(dir, extList = ['.ts', '.tsx']) {
  let res = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== '.git') {
        res = res.concat(getAllFiles(full, extList));
      }
    } else if (extList.includes(path.extname(entry.name))) {
      res.push(full);
    }
  }
  return res;
}

const files = getAllFiles('./src');
console.log('Total files scanned:', files.length);

const importRegex = /import\s+(?:type\s+)?(?:(\{[^}]+\})|([a-zA-Z0-9_$]+))\s+from\s+['"]([^'"]+)['"]/g;

for (const f of files) {
  const content = fs.readFileSync(f, 'utf8');
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const named = match[1];
    const source = match[3];
    if (source.startsWith('.')) {
      // Local import
      // Check file existence
      const dir = path.dirname(f);
      const targetBase = path.resolve(dir, source);
      const candidates = [
        targetBase,
        targetBase + '.ts',
        targetBase + '.tsx',
        targetBase + '.js',
        targetBase + '/index.ts',
        targetBase + '/index.tsx'
      ];
      const found = candidates.find(c => fs.existsSync(c));
      if (!found) {
        console.error(`MISSING LOCAL FILE: in ${f}, cannot find ${source}`);
      }
    }
  }
}
console.log('Import check complete');
