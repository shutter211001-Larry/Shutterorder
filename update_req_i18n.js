import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const localesDir = path.join(__dirname, 'packages/adminfront/src/i18n/locales');

const locales = [
  'en', 'es', 'fr', 'de', 'it', 'ja', 'ko', 'pt', 'th', 'tl', 'vi', 'id', 'zh-TW'
];

const reqKeys = {
  create: "Create Requisition",
  expectedDate: "Expected Date (Optional)",
  items: "Requisition Items",
  addItem: "Add Item",
  selectIngredient: "Select Ingredient",
  quantity: "Quantity"
};

const reqKeysTw = {
  create: "新增叫貨單",
  expectedDate: "期望到貨日期 (選填)",
  items: "叫貨品項",
  addItem: "新增品項",
  selectIngredient: "選擇原物料",
  quantity: "數量"
};

for (const locale of locales) {
  const filePath = path.join(localesDir, `${locale}.json`);
  if (!fs.existsSync(filePath)) continue;

  let content = fs.readFileSync(filePath, 'utf8');
  let data = JSON.parse(content);

  if (!data.requisition) {
    data.requisition = {};
  }
  
  if (locale === 'zh-TW') {
    data.requisition.create = reqKeysTw.create;
    data.requisition.expectedDate = reqKeysTw.expectedDate;
    data.requisition.items = reqKeysTw.items;
    data.requisition.addItem = reqKeysTw.addItem;
    data.requisition.selectIngredient = reqKeysTw.selectIngredient;
    data.requisition.quantity = reqKeysTw.quantity;
  } else {
    data.requisition.create = reqKeys.create;
    data.requisition.expectedDate = reqKeys.expectedDate;
    data.requisition.items = reqKeys.items;
    data.requisition.addItem = reqKeys.addItem;
    data.requisition.selectIngredient = reqKeys.selectIngredient;
    data.requisition.quantity = reqKeys.quantity;
  }
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Updated ${locale}.json`);
}
