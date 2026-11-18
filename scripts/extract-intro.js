const fs = require('fs');
const text = fs.readFileSync('clean_1l3ecubevlqe5.js', 'utf8');

const introIdx = text.indexOf('className:"product-intro"');
console.log('=== PRODUCT INTRO ===');
console.log(text.substring(Math.max(0, introIdx - 1500), introIdx + 300));

const innerInfoIdx = text.indexOf('className:"product-inner-info"');
console.log('=== PRODUCT INNER INFO ===');
console.log(text.substring(Math.max(0, innerInfoIdx - 1500), innerInfoIdx + 300));
