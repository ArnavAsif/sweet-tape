const fs = require("fs");

let raw = fs.readFileSync("src/data/productsData.json", "utf8");
raw = raw.replaceAll("&#x27;", "'");
raw = raw.replaceAll("&amp;", "&");
raw = raw.replaceAll("&quot;", '"');
raw = raw.replaceAll("&lt;", "<");
raw = raw.replaceAll("&gt;", ">");
raw = raw.replaceAll("&#39;", "'");

fs.writeFileSync("src/data/productsData.json", raw);
console.log("Decoded successfully!");
