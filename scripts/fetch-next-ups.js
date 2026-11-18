const fs = require('fs');

async function main() {
  const slugs = ['cloth', 'masking', 'opp', 'opp-quiet', 'stationery', 'double'];
  for (const slug of slugs) {
    const res = await fetch(`https://sweet-tape.com/products/${slug}`);
    const html = await res.text();
    const nextMatch = html.match(/class="next-up"[^>]*style="([^"]+)"[^>]*>([\s\S]*?)<\/section>/);
    if (nextMatch) {
      console.log(`\n=== SLUG: ${slug} ===`);
      console.log('style:', nextMatch[1]);
      const rollMatch = nextMatch[2].match(/class="bottom-roll"[^>]*src="([^"]+)"/);
      console.log('bottom-roll src:', rollMatch ? rollMatch[1] : 'none');
      const hrefMatch = nextMatch[2].match(/href="([^"]+)"/);
      console.log('href:', hrefMatch ? hrefMatch[1] : 'none');
      const labelMatch = nextMatch[2].match(/aria-label="([^"]+)"/);
      console.log('aria-label:', labelMatch ? labelMatch[1] : 'none');
    }
  }
}

main();
