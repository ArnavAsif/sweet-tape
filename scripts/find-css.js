const fs = require("fs");
const css = fs.readFileSync("src/app/globals.css", "utf8");
let idx = 0;
while ((idx = css.indexOf("siblings-title", idx)) !== -1) {
  console.log("Found at", idx, ":");
  console.log(css.substring(Math.max(0, idx - 100), idx + 200));
  idx += 14;
}
