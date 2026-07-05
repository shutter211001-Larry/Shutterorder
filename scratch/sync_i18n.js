const fs = require('fs');
const path = require('path');

const locales = ['de.json', 'en.json', 'es.json', 'fr.json', 'id.json', 'it.json', 'ja.json', 'ko.json', 'pt.json', 'th.json', 'tl.json', 'vi.json', 'zh-TW.json'];

// Adminfront Translations
const adminfrontDir = path.join(__dirname, '../packages/adminfront/src/i18n/locales');
const adminKeys = {
  fulfillOrder: {
    'zh-TW.json': '填寫出貨資訊',
    'en.json': 'Fulfill Order',
    'ja.json': '発送情報を入力',
    'ko.json': '배송 정보 입력'
  },
  logisticsProvider: {
    'zh-TW.json': '物流公司',
    'en.json': 'Logistics Provider',
    'ja.json': '物流会社',
    'ko.json': '물류 회사'
  },
  trackingNumber: {
    'zh-TW.json': '託運單號',
    'en.json': 'Tracking Number',
    'ja.json': '追跡番号',
    'ko.json': '송장 번호'
  }
};

for (const locale of locales) {
  const filePath = path.join(adminfrontDir, locale);
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (!data.orderDetail) data.orderDetail = {};
    
    data.orderDetail.fulfillOrder = adminKeys.fulfillOrder[locale] || adminKeys.fulfillOrder['en.json'];
    data.orderDetail.logisticsProvider = adminKeys.logisticsProvider[locale] || adminKeys.logisticsProvider['en.json'];
    data.orderDetail.trackingNumber = adminKeys.trackingNumber[locale] || adminKeys.trackingNumber['en.json'];
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
  }
}

// Storefront Translations
const storefrontDir = path.join(__dirname, '../packages/storefront/src/i18n/locales');
const storeKeys = {
  homeDelivery: {
    'zh-TW.json': '宅配',
    'en.json': 'Home Delivery',
    'ja.json': '宅配便',
    'ko.json': '택배'
  },
  storeToStore: {
    'zh-TW.json': '店到店',
    'en.json': 'Store-to-Store Pickup',
    'ja.json': 'コンビニ受取',
    'ko.json': '편의점 수령'
  }
};

for (const locale of locales) {
  const filePath = path.join(storefrontDir, locale);
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (!data.checkout) data.checkout = {};
    
    data.checkout.homeDelivery = storeKeys.homeDelivery[locale] || storeKeys.homeDelivery['en.json'];
    data.checkout.storeToStore = storeKeys.storeToStore[locale] || storeKeys.storeToStore['en.json'];
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
  }
}

console.log('Translations synced for all 13 languages!');
