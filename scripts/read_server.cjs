const fs = require('fs');
const path = require('path');
const serverPath = path.join(__dirname, '../backend/server.cjs');
const content = fs.readFileSync(serverPath, 'utf8');
console.log(content);
