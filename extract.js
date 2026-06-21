const fs = require('fs');
const html = fs.readFileSync('SembakoBerkah.html', 'utf8');
const regex = /id="([^"]+)"/g;
let match;
const ids = new Set();
while ((match = regex.exec(html)) !== null) {
  ids.add(match[1]);
}
console.log(Array.from(ids).join('\n'));
