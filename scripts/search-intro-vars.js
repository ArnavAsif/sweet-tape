const fs = require('fs');
const text = fs.readFileSync('clean_1l3ecubevlqe5.js', 'utf8');

const idx = text.indexOf('initProductIntro');
console.log(text.substring(Math.max(0, idx - 400), idx + 100));
