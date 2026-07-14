const fetch = require('node-fetch') || globalThis.fetch;

async function run() {
  const endpoints = [
    '/api/dashboard',
    '/api/dashboard/summary',
    '/api/menu/categories',
    '/api/menu/items',
    '/api/locations',
    '/api/group-orders',
    '/api/line/status',
    '/api/settings',
    '/shutter-erp/api/inventory/suppliers',
    '/shutter-erp/api/hr/shifts'
  ];

  console.log('--- API Connectivity Audit ---');
  for (const ep of endpoints) {
    try {
      const res = await fetch(`http://localhost:3000${ep}`, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'x-tenant-id': 'demo-tenant-123'
        }
      });
      const text = await res.text();
      console.log(`GET ${ep.padEnd(40)} -> ${res.status}`);
      if (res.status === 500) {
        console.error(`  [!] ERROR 500: ${text.substring(0, 200)}`);
      }
    } catch (e) {
      console.error(`GET ${ep.padEnd(40)} -> FAILED: ${e.message}`);
    }
  }
}

run();
