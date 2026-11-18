const fs = require('fs');

const images = [
  'public/assets/sibling-opp-normal.webp',
  'public/api/media/file/double-card.webp',
  'public/api/media/file/opp-quiet-card.webp',
  'public/api/media/file/masking-card.webp',
  'public/api/media/file/cloth-card.webp',
  'public/api/media/file/stationery-card.svg'
];

for (const img of images) {
  console.log(img, fs.existsSync(img) ? 'EXISTS' : 'MISSING');
}
