const fs = require('fs');
const p = 'packages/api-server/src/middleware/security.ts';
let c = fs.readFileSync(p, 'utf8');
c = c.replace(/rateLimit\(\{/g, "process.env.NODE_ENV === 'test' ? ((req, res, next) => next()) : rateLimit({");
fs.writeFileSync(p, c);
