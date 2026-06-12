const fs = require('fs');
const path = require('path');

const filesToFix = [
  'app/admin/blog/[id]/BlogEditorClient.tsx',
  'app/admin/blog/new/BlogEditorClient.tsx',
];

filesToFix.forEach(f => {
  const p = path.join(__dirname, f);
  if (!fs.existsSync(p)) {
    console.log('Missing', f);
    return;
  }
  let content = fs.readFileSync(p, 'utf8');

  // Remove the old useLocation
  content = content.replace(/const\s+\[,\s*navigate\]\s*=\s*useLocation\(\);/g, '');
  // Since we already have router, replace `navigate(` with `router.push(`
  content = content.replace(/navigate\(/g, 'router.push(');

  fs.writeFileSync(p, content);
  console.log('Fixed navigate in', f);
});
