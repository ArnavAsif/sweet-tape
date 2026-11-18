const fs = require('fs');

async function main() {
  const chunks = ['1l3ecubevlqe5.js', '15e1rmzfrztit.js'];
  for (const c of chunks) {
    const res = await fetch('https://sweet-tape.com/_next/static/chunks/' + c);
    const text = await res.text();
    const clean = text.replace(/;/g, ';\n').replace(/\{/g, '{\n').replace(/\}/g, '\n}\n');
    fs.writeFileSync('clean_' + c, clean);
    console.log('Saved clean_' + c, 'length:', text.length);
  }
}

main();
