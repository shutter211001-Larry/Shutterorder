const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'packages', 'adminfront', 'src', 'i18n', 'locales');
const files = fs.readdirSync(localesDir);

files.forEach(file => {
  if (file.endsWith('.json')) {
    const filePath = path.join(localesDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace terms
    content = content.replace(/加盟分店/g, '店家');
    content = content.replace(/加盟店/g, '店家');
    content = content.replace(/分店/g, '店家');
    content = content.replace(/本店/g, '店家');
    content = content.replace(/加盟主/g, '負責人');
    content = content.replace(/加盟/g, '店家');
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
