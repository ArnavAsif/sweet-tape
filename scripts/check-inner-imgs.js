const fs = require('fs');

async function main() {
  const slugs = ['cloth', 'masking', 'opp', 'opp-quiet', 'stationery', 'double'];
  for (const s of slugs) {
    const res = await fetch(`https://sweet-tape.com/products/${s}`);
    const html = await res.text();
    const start = html.indexOf('class="product-inner-info"');
    if (start === -1) continue;
    const end = html.indexOf('</section>', start);
    const info = html.substring(start, end);
    const imgs = [...info.matchAll(/src="([^"]+)"/g)].map(m => m[1]);
    console.log(s, imgs);
  }
}

main();
