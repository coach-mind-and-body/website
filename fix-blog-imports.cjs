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

  // Replace @/_core/hooks/useAuth with @/hooks/use-auth
  content = content.replace(/import\s+\{\s*useAuth\s*\}\s+from\s+["']@\/_core\/hooks\/useAuth["'];/g, 'import { useAuth } from "@/hooks/use-auth";');

  // Wait, does it still have wouter?
  content = content.replace(/import\s+\{.*\}\s+from\s+["']wouter["'];/g, '');

  fs.writeFileSync(p, content);
  console.log('Fixed imports in', f);
});
