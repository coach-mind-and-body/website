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

  // Add the imports
  if (!content.includes('next/navigation')) {
    content = content.replace(/import \{ useState/, 'import { useRouter, useParams } from "next/navigation";\nimport { useState');
  }

  // Add the router and params inside the component
  content = content.replace(/const \{ user, loading: authLoading, isAuthenticated \} = useAuth\(\);\s+const editId = params\?\.id/g, 'const { user, loading: authLoading, isAuthenticated } = useAuth();\n  const router = useRouter();\n  const params = useParams<{ id: string }>();\n  const editId = params?.id');

  fs.writeFileSync(p, content);
  console.log('Fixed router in', f);
});
