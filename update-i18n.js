const fs = require('fs');
const path = require('path');

const localesDir = path.join('c:', 'Github', 'kitchenasty', 'packages', 'adminfront', 'src', 'i18n', 'locales');
const locales = [
  { file: 'en.json', translation: 'Location Exclusive' },
  { file: 'es.json', translation: 'Exclusivo de Sucursal' },
  { file: 'fr.json', translation: 'Exclusivité de la Succursale' },
  { file: 'de.json', translation: 'Filialexklusiv' },
  { file: 'it.json', translation: 'Esclusiva della Filiale' },
  { file: 'ja.json', translation: '店舗限定' },
  { file: 'ko.json', translation: '매장 전용' },
  { file: 'pt.json', translation: 'Exclusivo da Filial' },
  { file: 'th.json', translation: 'เฉพาะสาขา' },
  { file: 'tl.json', translation: 'Eksklusibo sa Sangay' },
  { file: 'vi.json', translation: 'Dành riêng cho chi nhánh' },
  { file: 'id.json', translation: 'Khusus Cabang' },
  { file: 'zh-TW.json', translation: '門市專屬' }
];

for (const locale of locales) {
  const filePath = path.join(localesDir, locale.file);
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath, 'utf8');
    let json = JSON.parse(data);
    
    if (!json.menuItemList) {
      json.menuItemList = {};
    }
    
    json.menuItemList.branchCustom = locale.translation;
    
    fs.writeFileSync(filePath, JSON.stringify(json, null, 2) + '\n', 'utf8');
    console.log(`Updated ${locale.file}`);
  } else {
    console.error(`File not found: ${locale.file}`);
  }
}
