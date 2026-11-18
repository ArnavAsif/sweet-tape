const fs = require("fs");
const js = fs.readFileSync("clean_1l3ecubevlqe5.js", "utf8");
let idx = js.indexOf("next-up");
if (idx !== -1) {
  console.log(js.substring(Math.max(0, idx - 1200), idx + 200));
}
