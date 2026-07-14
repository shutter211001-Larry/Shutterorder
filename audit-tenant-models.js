const fs = require('fs');

const schemaContent = fs.readFileSync('prisma/schema.prisma', 'utf8');
const dbTsContent = fs.readFileSync('packages/api-server/src/lib/db.ts', 'utf8');

// Parse models with tenantId
const modelsWithTenantId = new Set();
let currentModel = null;

const lines = schemaContent.split('\n');
for (const line of lines) {
  const modelMatch = line.match(/^model\s+([A-Za-z0-9_]+)\s*\{/);
  if (modelMatch) {
    currentModel = modelMatch[1];
  } else if (currentModel) {
    if (line.includes('tenantId String')) {
      modelsWithTenantId.add(currentModel);
    } else if (line.startsWith('}')) {
      currentModel = null;
    }
  }
}

// Parse tenantAwareModels from db.ts
const awareModelsMatch = dbTsContent.match(/const tenantAwareModels = \[([\s\S]*?)\];/);
const awareModelsStr = awareModelsMatch ? awareModelsMatch[1] : '';
const tenantAwareModels = new Set(
  awareModelsStr.split(',')
    .map(s => s.trim().replace(/['"]/g, ''))
    .filter(s => s.length > 0)
);

console.log('--- Multi-Tenancy Isolation Audit ---');
let leakFound = false;

for (const model of modelsWithTenantId) {
  if (!tenantAwareModels.has(model)) {
    console.log(`[!] Data Leak Risk: Model '${model}' has 'tenantId' but is missing from 'tenantAwareModels' in db.ts!`);
    leakFound = true;
  }
}

if (!leakFound) {
  console.log('✅ All models with tenantId are correctly registered in tenantAwareModels. No structural data leak risks found.');
}
