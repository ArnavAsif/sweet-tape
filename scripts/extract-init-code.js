const fs = require('fs');

const chunk1 = fs.readFileSync('clean_1l3ecubevlqe5.js', 'utf8');
const chunk2 = fs.readFileSync('clean_15e1rmzfrztit.js', 'utf8');

function findIn(text, name, maxLen = 3000) {
  let idx = text.indexOf(name);
  if (idx !== -1) {
    console.log(`\n=================== ${name} ===================`);
    console.log(text.substring(Math.max(0, idx - 50), idx + maxLen));
  }
}

findIn(chunk1, 'initProductIntro');
findIn(chunk2, 'initProductRoll');
findIn(chunk2, 'initChipFlip');
