const fs = require('fs');
const data = require('../src/data/productsData.json');

const rolls = {
  cloth: {
    nextRollImg: '/assets/sibling-opp-normal.webp',
    nextStyle: '--reel-bg:#182997;--reel-ink:#919CFF;--ring:#e4f7a8;--bg:#b6fe00;--word:#52AF16;--tag-bg:#013900;--tag-ink:#b6fe00;--ink:#013900'
  },
  masking: {
    nextRollImg: '/api/media/file/double-card.webp',
    nextStyle: '--reel-bg:#FA8005;--reel-ink:#FFDC13;--ring:#a8dcf0;--bg:#50CBFF;--word:#007db2;--tag-bg:#1b87b8;--tag-ink:#8bd8f5;--ink:#1b87b8'
  },
  opp: {
    nextRollImg: '/api/media/file/opp-quiet-card.webp',
    nextStyle: '--ring:#fff0b0;--bg:#F7D000;--word:#a88700;--tag-bg:#a88700;--tag-ink:#ffeda0;--ink:#8a6f00'
  },
  'opp-quiet': {
    nextRollImg: '/api/media/file/masking-card.webp',
    nextStyle: '--reel-bg:#D1CA00;--reel-ink:#676300;--ring:#fff1a2;--bg:#fa8005;--word:#fcd805;--tag-bg:#EB7100;--tag-ink:#FCD805;--ink:#FFDC13'
  },
  stationery: {
    nextRollImg: '/api/media/file/cloth-card.webp',
    nextStyle: '--reel-bg:#E56145;--reel-ink:#EFA283;--ring:#d9d2f7;--bg:#2E3EAC;--word:#919CFF;--tag-bg:#172795;--tag-ink:#919CFF;--ink:#919CFF'
  },
  double: {
    nextRollImg: '/api/media/file/stationery-card.svg',
    nextStyle: '--reel-bg:#3EB9ED;--reel-ink:#007DB1;--ring:#ffd9c2;--bg:#FF7B5F;--word:#a82712;--tag-bg:#9e2a12;--tag-ink:#f2a08c;--ink:#9e2a12'
  }
};

for (const [slug, item] of Object.entries(rolls)) {
  if (data[slug]) {
    data[slug].nextRollImg = item.nextRollImg;
    data[slug].nextStyle = item.nextStyle;
  }
}

fs.writeFileSync('src/data/productsData.json', JSON.stringify(data, null, 2));
console.log('Updated productsData.json with nextRollImg and nextStyle');
