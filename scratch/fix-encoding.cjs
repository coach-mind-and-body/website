const fs = require("fs");
const path = require("path");

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, "utf-8");
  const original = content;

  content = content.replace(/ðŸ‘‹/g, "👋");
  content = content.replace(/ðŸŽ‰/g, "🎉");
  content = content.replace(/â€“/g, "–");
  content = content.replace(/â€”/g, "—");
  content = content.replace(/âœ“/g, "✓");
  content = content.replace(/âœ…/g, "✅");
  content = content.replace(/â ³/g, "⏳");
  content = content.replace(/Ã—/g, "×");
  content = content.replace(/â†’/g, "→");
  content = content.replace(/â€¦/g, "…");
  content = content.replace(/â€™/g, "’");

  if (content !== original) {
    fs.writeFileSync(filePath, content, "utf-8");
    console.log("Fixed:", filePath);
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath);
    } else if (file.endsWith(".ts") || file.endsWith(".tsx")) {
      fixFile(fullPath);
    }
  }
}

walk(path.join(__dirname, "../app"));
walk(path.join(__dirname, "../server"));
