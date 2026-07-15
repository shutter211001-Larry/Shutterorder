const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'packages/adminfront/src/i18n/locales');
const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));

const marketingDashboardKeys = {
  last7Days: "Last 7 Days",
  last30Days: "Last 30 Days",
  last90Days: "Last 90 Days",
  allTime: "All Time",
  totalTrackedOrders: "Total Tracked Orders",
  totalTrackedRevenue: "Total Tracked Revenue",
  utmGenerator: "產生行銷追蹤網址 (UTM Generator)",
  sourceLabel: "來源 (Source)",
  sourcePlaceholder: "e.g. facebook, google, ig",
  mediumLabel: "媒介 (Medium)",
  mediumPlaceholder: "e.g. social, cpc, email",
  campaignLabel: "活動 (Campaign)",
  campaignPlaceholder: "e.g. summer_sale, kol_promo",
  copyLink: "複製網址",
  copied: "已複製！",
  funnelAnalysis: "購物漏斗轉換分析 (Shopping Funnel Analysis)",
  viewMenu: "瀏覽菜單",
  dropoff: "流失",
  addToCart: "加入購物車",
  beginCheckout: "開始結帳",
  purchase: "完成購買",
  campaignPerformance: "Campaign Performance",
  source: "來源 (Source)",
  medium: "媒介 (Medium)",
  campaign: "活動 (Campaign)",
  orders: "訂單數 (Orders)",
  revenue: "營收 (Revenue)",
  noData: "No marketing data found for the selected period.",
  utmGuideTitle: "欄位填寫說明與建議",
  utmGuideSource: "客流從哪來？ (例如：facebook, google, line)",
  utmGuideMedium: "透過什麼方式？ (例如：cpc 付費廣告, social 社群貼文)",
  utmGuideCampaign: "因為什麼活動？ (例如：summer_sale, mothers_day)",
  utmGuideNote: "這三個欄位皆為非必填，但若全部留白將無法追蹤成效。強烈建議至少填寫「來源 (Source)」。"
};

for (const file of files) {
  const filePath = path.join(localesDir, file);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    
    data.marketingDashboard = marketingDashboardKeys;
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
    console.log(`Updated ${file}`);
  } catch (e) {
    console.error(`Error updating ${file}:`, e);
  }
}
