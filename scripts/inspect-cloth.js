const fs = require('fs');

async function main() {
  const res = await fetch('https://sweet-tape.com/products/cloth');
  const html = await res.text();
  const scriptRegex = /src="([^"]+\.js)"/g;
  const scripts = [];
  let match;
  while ((match = scriptRegex.exec(html)) !== null) {
    scripts.push(match[1]);
  }
  console.log('Total scripts found:', scripts.length);

  for (const s of scripts) {
    try {
      const sRes = await fetch('https://sweet-tape.com' + s);
      const text = await sRes.text();
      if (text.includes('product-intro') || text.includes('product-inner-info')) {
        console.log('Found product-intro in:', s, 'length:', text.length);
        fs.writeFileSync('product_page_chunk.js', text);
      }
    } catch (err) {
      console.error('Error fetching', s, err.message);
    }
  }
}

main();
