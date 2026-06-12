const fs = require('fs');
const path = require('path');

const destPath = path.join(__dirname, 'app/reset-password/ResetPasswordClient.tsx');
let content = fs.readFileSync(destPath, 'utf8');

// Replace wouter usage that was missed
content = content.replace(/const\s+\[,\s*navigate\]\s*=\s*useLocation\(\);/g, 'const router = useRouter();');
content = content.replace(/navigate\(/g, 'router.push(');
content = content.replace(/const\s+search\s*=\s*useSearch\(\);/g, 'const searchParams = useSearchParams();');
content = content.replace(/const\s+params\s*=\s*new\s+URLSearchParams\(search\);/g, '');

// Since searchParams is already a URLSearchParams in Next.js useSearchParams(), we just leave `params.get`... wait!
// The previous code had `params.get("token")`. If I replace `params` with `searchParams`, I need to change `params` to `searchParams`.
content = content.replace(/params\.get/g, 'searchParams.get');

fs.writeFileSync(destPath, content);
console.log('Fixed missed wouter calls in ResetPasswordClient.tsx');
