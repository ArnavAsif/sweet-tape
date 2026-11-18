const fs = require("fs");
const js = fs.readFileSync("clean_1l3ecubevlqe5.js", "utf8");

function dumpRange(name, center, before = 2500, after = 1500) {
  console.log(`\n================= ${name} =================`);
  console.log(js.substring(Math.max(0, center - before), center + after));
}

dumpRange("SUPER POWERS", 20134, 3000, 500);
dumpRange("PRODUCT REEL", 11259, 2500, 500);
