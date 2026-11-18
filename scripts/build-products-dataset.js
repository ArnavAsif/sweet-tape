const fs = require('fs');

async function main() {
  const slugs = ['cloth', 'masking', 'opp', 'opp-quiet', 'stationery', 'double'];
  const dataset = {};

  for (const slug of slugs) {
    const res = await fetch(`https://sweet-tape.com/products/${slug}`);
    const html = await res.text();

    // 1. Intro section
    const introMatch = html.match(/<section class="product-intro"[^>]*data-model="([^"]+)"(?:\s+data-clarity="([^"]+)")?[^>]*style="([^"]+)"/);
    const model = introMatch ? introMatch[1] : '';
    const clarity = introMatch && introMatch[2] ? parseFloat(introMatch[2]) : 0;
    const introStyleStr = introMatch ? introMatch[3] : '';

    const titleMatch = html.match(/<h1 class="sr-only">([^<]+)<\/h1>/);
    const title = titleMatch ? titleMatch[1] : '';

    const wordMatch = html.match(/class="bottom-title" data-word="([^"]+)"/);
    const word = wordMatch ? wordMatch[1] : '';

    // bottom glyphs
    const glyphs = [...html.matchAll(/<span class="glyph"><img src="([^"]+)" alt="([^"]*)"/g)].map(m => m[1]);

    const cardImgMatch = html.match(/class="pi-roll-in"><img src="([^"]+)"/);
    const cardImg = cardImgMatch ? cardImgMatch[1].split('?')[0] : '';

    // 2. Inner-info
    const innerInfoStyleMatch = html.match(/<section class="product-inner-info"[^>]*style="([^"]+)"/);
    const innerInfoStyle = innerInfoStyleMatch ? innerInfoStyleMatch[1] : '';

    const shotMatch = html.match(/class="info-shot"><img src="([^"]+)"/);
    const shotImg = shotMatch ? shotMatch[1].split('?')[0] : '';

    const peelMatch = html.match(/class="peel-turn"><img src="([^"]+)"/);
    const peelImg = peelMatch ? peelMatch[1] : '';

    const noteMatch = html.match(/class="hand-note info-note".*?<div class="hand-ink"[^>]*>(.*?)<\/div>/s);
    let note = [];
    if (noteMatch) {
      note = [...noteMatch[1].matchAll(/<span class="hand-line">([^<]+)<\/span>/g)].map(m => m[1]);
    }

    const storyMatch = html.match(/class="h3 info-story" aria-label="([^"]+)"/);
    const story = storyMatch ? storyMatch[1] : '';

    // 3. Siblings section
    const sibStyleMatch = html.match(/<section class="siblings-section"[^>]*style="([^"]+)"/);
    const sibStyle = sibStyleMatch ? sibStyleMatch[1] : '';

    const siblingsCards = [...html.matchAll(/class="siblings-card"[^>]*style="([^"]+)"[^>]*><img class="siblings-face" src="([^"]+)" alt="([^"]+)"\/>(?:<span class="sib-colours">.*?<\/span>)?/g)];
    const siblings = [];
    for (const sc of siblingsCards) {
      const cardStyle = sc[1];
      const img = sc[2].split('?')[0];
      const alt = sc[3];
      // extract dots
      const cardSub = html.substring(sc.index, sc.index + 500);
      const dots = [...cardSub.matchAll(/class="sib-dot" style="background:([^"]+)"/g)].map(m => m[1]);
      siblings.push({
        style: cardStyle,
        img,
        alt,
        dots
      });
    }

    // 4. Super powers
    const powStyleMatch = html.match(/<section class="super-powers"[^>]*style="([^"]+)"/);
    const powStyle = powStyleMatch ? powStyleMatch[1] : '';

    const powerCards = [...html.matchAll(/class="powers-card"[^>]*data-power="([^"]+)"[^>]*>.*?<h3 class="powers-claim">([^<]+)<\/h3>.*?<p class="powers-desc">([^<]+)<\/p>/gs)].map(m => ({
      power: m[1],
      claim: m[2],
      desc: m[3]
    }));

    // 5. Product reel
    const reelStyleMatch = html.match(/<section class="product-reel"[^>]*style="([^"]+)"/);
    const reelStyle = reelStyleMatch ? reelStyleMatch[1] : '';

    // 6. Next up
    const nextStyleMatch = html.match(/<section class="next-up"[^>]*style="([^"]+)"/);
    const nextStyle = nextStyleMatch ? nextStyleMatch[1] : '';
    const nextHrefMatch = html.match(/class="next-up".*?href="([^"]+)"/s);
    const nextHref = nextHrefMatch ? nextHrefMatch[1] : '';
    const nextLabelMatch = html.match(/aria-label="Next up: ([^"]+)"/);
    const nextLabel = nextLabelMatch ? nextLabelMatch[1] : '';

    dataset[slug] = {
      slug,
      title,
      word,
      model,
      clarity,
      cardImg,
      introStyleStr,
      glyphs,
      innerInfoStyle,
      shotImg,
      peelImg,
      note,
      story,
      sibStyle,
      siblings,
      powStyle,
      powerCards,
      reelStyle,
      nextStyle,
      nextHref,
      nextLabel
    };
    console.log(`Processed ${slug}: ${title} (${glyphs.length} glyphs, ${siblings.length} sibs)`);
  }

  if (!fs.existsSync('src/data')) fs.mkdirSync('src/data', { recursive: true });
  fs.writeFileSync('src/data/productsData.json', JSON.stringify(dataset, null, 2));
  console.log('Saved src/data/productsData.json');
}

main();
