const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, 'client/src/pages/ResetPassword.tsx');
let content = fs.readFileSync(srcPath, 'utf8');

// Replace wouter imports
content = content.replace(/import\s+\{\s*useLocation\s*,\s*useSearch\s*\}\s+from\s+["']wouter["'];?/g, 'import { useRouter, useSearchParams } from "next/navigation";');

// Replace hooks
content = content.replace(/const\s+\[,\s*setLocation\]\s*=\s*useLocation\(\);/g, 'const router = useRouter();');
content = content.replace(/setLocation\(/g, 'router.push(');
content = content.replace(/const\s+searchString\s*=\s*useSearch\(\);/g, 'const searchParams = useSearchParams();');
content = content.replace(/const\s+searchParams\s*=\s*new\s+URLSearchParams\(searchString\);/g, '');

// Change export name
content = content.replace(/export default function ResetPassword\(\)/g, 'export default function ResetPasswordClient()');

// Add "use client" directive
content = '"use client";\n\n' + content;

const destPath = path.join(__dirname, 'app/reset-password/ResetPasswordClient.tsx');
fs.writeFileSync(destPath, content);
console.log('Restored and fixed ResetPasswordClient.tsx');
