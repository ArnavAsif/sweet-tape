const fs = require('fs');

function inspectChunk(filename) {
  const text = fs.readFileSync(filename, 'utf8');
  console.log('===', filename, '===');
  const matches = [...text.matchAll(/(\"default\",0|className:\"[^\"]+\")/g)].map(m => m[0]);
  console.log(matches.slice(0, 30));
}

inspectChunk('clean_1l3ecubevlqe5.js');
inspectChunk('clean_15e1rmzfrztit.js');
