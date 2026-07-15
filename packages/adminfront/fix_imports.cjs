const fs = require('fs');
const path = require('path');

const dirs = ['hr', 'menu', 'settings', 'crm', 'operations', 'design', 'locations'];
const baseDir = 'd:/Github/OrderTool/packages/adminfront/src/pages';

dirs.forEach(dir => {
  const dirPath = path.join(baseDir, dir);
  if (!fs.existsSync(dirPath)) return;
  const files = fs.readdirSync(dirPath);
  files.forEach(file => {
    if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.js')) {
      const filePath = path.join(dirPath, file);
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Match `from '../` and `import('../` but ensure it's exactly one `../` (by checking negative lookahead)
      content = content.replace(/from\s+['"]\.\.\/(?!\.\.)([^'"]+)['"]/g, "from '../../$1'");
      content = content.replace(/import\s*\(\s*['"]\.\.\/(?!\.\.)([^'"]+)['"]\s*\)/g, "import('../../$1')");
      
      fs.writeFileSync(filePath, content, 'utf8');
    }
  });
});
console.log('Imports fixed.');
