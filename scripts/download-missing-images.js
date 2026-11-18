const fs = require('fs');
const path = require('path');

const missing = [
  '/assets/sibling-cloth-normal.webp',
  '/assets/sibling-cloth-strong.webp',
  '/api/media/file/Group%20876.webp',
  '/assets/sibling-masking-strong.webp',
  '/assets/sibling-opp-strong.webp',
  '/assets/sibling-opp-xtra-strong.webp',
  '/api/media/file/img-stationery-tape.webp',
  '/api/media/file/Group%20872.webp',
  '/assets/sibling-stationery-cello.svg',
  '/api/media/file/img-double-sided-tape.webp'
];

async function main() {
  for (const img of missing) {
    const url = 'https://sweet-tape.com' + img;
    const local = 'public' + decodeURIComponent(img);
    const dir = path.dirname(local);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.error('Failed to fetch:', url, res.status);
        continue;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(local, buf);
      console.log(`Downloaded ${img} (${buf.length} bytes) -> ${local}`);
    } catch (err) {
      console.error('Error downloading:', img, err.message);
    }
  }
}

main();
