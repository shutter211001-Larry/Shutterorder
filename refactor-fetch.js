const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'packages/adminfront/src/pages');

function refactorFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Check if we need to import api
  let needsApiImport = false;

  // Replace fetch GET (simple case)
  // e.g. fetch('/api/settings/general', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
  content = content.replace(/fetch\(['"`]\/api\/([^'"`]+)['"`],\s*\{\s*headers:\s*\{\s*Authorization:\s*`Bearer \$\{token\}`\s*\}\s*\}\s*\)\s*\.then\([^)]+\)\s*\.then\(\(([^)]+)\)\s*=>/g, (match, path, param) => {
    needsApiImport = true;
    return `api.get(\`/${path}\`).then((${param}) =>`;
  });

  // Replace fetch with method
  // const res = await fetch('/api/settings/general', { method: 'PUT', headers: { ... }, body: ... })
  // We can't do this purely with regex reliably if it spans multiple lines.

  if (content !== originalContent) {
    if (needsApiImport && !content.includes("import { api }")) {
      content = "import { api } from '../lib/api.js';\n" + content;
    }
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Refactored: ${filePath}`);
  }
}

function traverse(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverse(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      refactorFile(fullPath);
    }
  }
}

traverse(directoryPath);
