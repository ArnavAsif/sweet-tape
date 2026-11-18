const fs = require('fs');

const text = fs.readFileSync('clean_1l3ecubevlqe5.js', 'utf8');

function extractAround(term, len = 2000) {
  let idx = 0;
  while ((idx = text.indexOf(term, idx)) !== -1) {
    console.log(`\n=================== FOUND "${term}" at ${idx} ===================`);
    console.log(text.substring(Math.max(0, idx - 100), idx + len));
    idx += term.length;
    break; // first occurrence
  }
}

extractAround('product-intro', 3000);
