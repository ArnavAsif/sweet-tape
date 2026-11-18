const fs = require('fs');

async function main() {
  const res = await fetch('https://sweet-tape.com/products/cloth');
  const html = await res.text();
  
  const sections = ['product-intro', 'product-inner-info', 'siblings-section', 'super-powers', 'product-reel', 'next-up'];
  for (const s of sections) {
    const start = html.indexOf(`class="${s}"`);
    if (start === -1) {
      console.log('Not found:', s);
      continue;
    }
    const tagStart = html.lastIndexOf('<section', start);
    const tagEnd = html.indexOf('</section>', start) + '</section>'.length;
    const markup = html.substring(tagStart, tagEnd);
    fs.writeFileSync(`markup_${s}.html`, markup);
    console.log(`Saved markup_${s}.html, length:`, markup.length);
  }
}

main();
