const fs = require('fs');
const path = require('path');

const destPath = path.join(__dirname, 'components/DashboardLayout.tsx');
let content = fs.readFileSync(destPath, 'utf8');

content = content.replace(/import\s+\{\s*useLocation\s*\}\s+from\s+["']wouter["'];/g, 'import { usePathname, useRouter } from "next/navigation";');
content = content.replace(/const\s+\[location,\s*setLocation\]\s*=\s*useLocation\(\);/g, 'const location = usePathname();\n  const router = useRouter();');
content = content.replace(/setLocation\(/g, 'router.push(');

fs.writeFileSync(destPath, content);
console.log('Fixed DashboardLayout.tsx');
