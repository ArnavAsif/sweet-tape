const fs = require("fs");
const js = fs.readFileSync("clean_1l3ecubevlqe5.js", "utf8");
function findOccurrences(term) {
  let idx = 0;
  console.log("=== Term: " + term + " ===");
  while ((idx = js.indexOf(term, idx)) !== -1) {
    console.log("Found at", idx);
    console.log(js.substring(Math.max(0, idx - 100), idx + 400));
    idx += term.length;
  }
}
findOccurrences("super-powers");
findOccurrences("product-reel");
