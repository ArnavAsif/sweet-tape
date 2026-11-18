const fs = require('fs');
const text = fs.readFileSync('clean_15e1rmzfrztit.js', 'utf8');

const idx = text.indexOf('STAGE_LIGHT');
console.log(text.substring(Math.max(0, idx - 800), idx + 400));
