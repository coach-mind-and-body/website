const fs = require('fs');
const path = require('path');

const srcFile = path.join(__dirname, 'client/src/pages/BlogEditor.tsx');
let content = fs.readFileSync(srcFile, 'utf8');

// Replace wouter with next/navigation
content = content.replace(/import\s+\{\s*useLocation,\s*useRoute\s*\}\s+from\s+["']wouter["'];/g, 'import { useRouter, useParams } from "next/navigation";');
content = content.replace(/const\s+\[,\s*setLocation\]\s*=\s*useLocation\(\);/g, 'const router = useRouter();\n  const params = useParams<{ id: string }>();');
content = content.replace(/const\s+\[,\s*params\]\s*=\s*useRoute\([^)]+\);/g, '');
content = content.replace(/setLocation\(/g, 'router.push(');
content = content.replace(/@\/const/g, '@/lib/const');

// Copy to [id]
const target1 = path.join(__dirname, 'app/admin/blog/[id]/BlogEditorClient.tsx');
let content1 = content.replace(/export default function BlogEditor/g, 'export default function BlogEditorClient');
fs.writeFileSync(target1, '"use client";\n\n' + content1);

// Copy to new
const target2 = path.join(__dirname, 'app/admin/blog/new/BlogEditorClient.tsx');
fs.writeFileSync(target2, '"use client";\n\n' + content1);

console.log('Restored BlogEditorClient files');
