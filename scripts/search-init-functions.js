const fs = require('fs');

async function searchAllChunks() {
  const htmlRes = await fetch('https://sweet-tape.com/products/cloth');
  const html = await htmlRes.text();
  const scriptRegex = /src="([^"]+\.js)"/g;
  let match;
  while ((match = scriptRegex.exec(html)) !== null) {
    const s = match[1];
    const text = await (await fetch('https://sweet-tape.com' + s)).text();
    ['initProductIntro', 'initProductRoll', 'initChipFlip', 'siblings-section'].forEach(kw => {
      if (text.includes(kw)) {
        console.log(`Found "${kw}" in ${s}`);
      }
    });
  }
}

searchAllChunks();
