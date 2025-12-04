const fs = require('fs');
const path = require('path');
const content = fs.readFileSync(path.join(__dirname, '../backend/server.cjs'), 'utf8');
console.log(content);
