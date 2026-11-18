const fs = require('fs');

async function main() {
  const slugs = ['cloth', 'masking', 'opp', 'opp-quiet', 'stationery', 'double'];
  const allData = {};

  for (const slug of slugs) {
    try {
      const res = await fetch(`https://sweet-tape.com/products/${slug}`);
      const html = await res.text();
      
      // Extract intro section
      const introMatch = html.match(/<section class="product-intro"[^>]*data-model="([^"]+)"[^>]*style="([^"]+)"/);
      const model = introMatch ? introMatch[1] : '';
      const introStyle = introMatch ? introMatch[2] : '';

      // Extract h1 title (e.g. THE FIXER, THE ARTIST, THE RELIABLE, etc.)
      const titleMatch = html.match(/<h1 class="sr-only">([^<]+)<\/h1>/);
      const title = titleMatch ? titleMatch[1] : '';

      // Extract bottom-title word (e.g. data-word="fixer")
      const wordMatch = html.match(/class="bottom-title" data-word="([^"]+)"/);
      const word = wordMatch ? wordMatch[1] : '';

      // Extract glyph images in bottom-title
      const glyphMatches = [...html.matchAll(/<span class="glyph"><img src="([^"]+)"/g)].map(m => m[1]);

      // Extract inner-info story
      const storyMatch = html.match(/class="h3 info-story" aria-label="([^"]+)"/);
      const story = storyMatch ? storyMatch[1] : '';

      // Extract hand-note
      const noteMatch = html.match(/class="hand-note info-note"><span class="sr-only">([^<]+)<\/span>/);
      const note = noteMatch ? noteMatch[1] : '';

      // Extract info-shot image
      const shotMatch = html.match(/class="info-shot"><img src="([^"]+)"/);
      const shot = shotMatch ? shotMatch[1] : '';

      // Extract siblings
      const sibMatches = [...html.matchAll(/class="siblings-card"[^>]*style="([^"]+)"[^>]*><img class="siblings-face" src="([^"]+)" alt="([^"]+)"/g)].map(m => ({
        style: m[1],
        img: m[2],
        alt: m[3]
      }));

      // Extract next-up link
      const nextMatch = html.match(/class="next-up"[^>]*style="([^"]+)"[^>]*>.*?href="([^"]+)"/s);
      const nextStyle = nextMatch ? nextMatch[1] : '';
      const nextHref = nextMatch ? nextMatch[2] : '';

      allData[slug] = {
        slug,
        title,
        word,
        model,
        introStyle,
        glyphImages: glyphMatches,
        story,
        note,
        shot,
        siblings: sibMatches,
        nextStyle,
        nextHref
      };
      console.log(`Extracted ${slug}: Title="${title}", Word="${word}", Model="${model}", Siblings=${sibMatches.length}`);
    } catch (err) {
      console.error(`Error on ${slug}:`, err.message);
    }
  }

  fs.writeFileSync('all_products_data.json', JSON.stringify(allData, null, 2));
  console.log('Saved all_products_data.json');
}

main();
