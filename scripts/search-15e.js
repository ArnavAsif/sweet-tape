const fs = require('fs');
const text = fs.readFileSync('clean_15e1rmzfrztit.js', 'utf8');
console.log('length:', text.length);
console.log('preview:', text.substring(0, 500));
console.log('keywords:', [...text.matchAll(/(\w+Viewer|\w+Tape|GLTF|Three|camera|roll|mount)/g)].map(m => m[0]).slice(0, 20));
