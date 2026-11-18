const fs = require('fs');
const path = require('path');
const data = require('../src/data/productsData.json');

async function main() {
  const urls = new Set();

  for (const p of Object.values(data)) {
    if (p.cardImg) urls.add(p.cardImg);
    if (p.shotImg) urls.add(p.shotImg);
    if (p.peelImg) urls.add(p.peelImg);
    if (p.nextRollImg) urls.add(p.nextRollImg);
    if (p.glyphImages) p.glyphImages.forEach(g => urls.add(g));
    if (p.glyphs) p.glyphs.forEach(g => urls.add(g));
    if (p.siblings) {
      p.siblings.forEach(s => {
        if (s.img) urls.add(s.img);
      });
    }
  }

  console.log(`Checking ${urls.size} distinct asset URLs...`);

  for (let u of urls) {
    if (!u || u.startsWith('data:') || u.startsWith('http')) continue;
    // Strip query params
    const cleanPath = u.split('?')[0];
    const localFile = path.join('public', cleanPath.replace(/^\//, ''));
    if (!fs.existsSync(localFile)) {
      console.log(`MISSING: ${cleanPath} -> downloading from https://sweet-tape.com${cleanPath}`);
      try {
        const res = await fetch(`https://sweet-tape.com${cleanPath}`);
        if (res.ok) {
          const buf = Buffer.from(await res.arrayBuffer());
          fs.mkdirSync(path.dirname(localFile), { recursive: true });
          fs.writeFileSync(localFile, buf);
          console.log(`  Downloaded ${cleanPath} (${buf.length} bytes)`);
        } else {
          console.error(`  Failed (HTTP ${res.status}): ${cleanPath}`);
        }
      } catch (err) {
        console.error(`  Error downloading ${cleanPath}:`, err.message);
      }
    } else {
      // console.log(`EXISTS: ${cleanPath}`);
    }
  }
  console.log('Finished checking and downloading missing assets.');
}

main();
