const fs = require("fs");
const css = fs.readFileSync("src/app/globals.css", "utf8");
function findRule(name) {
  let idx = 0;
  while ((idx = css.indexOf(name, idx)) !== -1) {
    console.log("=== " + name + " at " + idx + " ===");
    console.log(css.substring(idx, idx + 400));
    idx += name.length;
  }
}
findRule(".next-up");
findRule(".site-footer");
