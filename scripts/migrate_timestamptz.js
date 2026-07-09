const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

// First, revert any botched "@db.Timestamptz?" or duplicate db attributes
schema = schema.replace(/@db\.Timestamptz\?/g, '');
schema = schema.replace(/DateTime @db\.Timestamptz(\s+)@db\.Date/g, 'DateTime$1@db.Date');
schema = schema.replace(/DateTime\? @db\.Timestamptz(\s+)@db\.Date/g, 'DateTime?$1@db.Date');
schema = schema.replace(/DateTime @db\.Timestamptz/g, 'DateTime');
schema = schema.replace(/DateTime\? @db\.Timestamptz/g, 'DateTime?');
schema = schema.replace(/@db\.Timestamptz/g, ''); // Clear all to start fresh

// Now carefully add @db.Timestamptz
const lines = schema.split('\n');
const newLines = lines.map(line => {
  if (line.includes('DateTime')) {
    // If it already has @db.Date, skip
    if (line.includes('@db.Date')) return line;
    // Replace DateTime? with DateTime? @db.Timestamptz
    if (line.match(/DateTime\?/)) {
      return line.replace(/DateTime\?/, 'DateTime? @db.Timestamptz');
    }
    // Replace DateTime with DateTime @db.Timestamptz
    if (line.match(/DateTime\b/)) {
      return line.replace(/DateTime\b/, 'DateTime @db.Timestamptz');
    }
  }
  return line;
});

fs.writeFileSync(schemaPath, newLines.join('\n'), 'utf8');
console.log('Successfully updated schema.prisma with proper @db.Timestamptz');
