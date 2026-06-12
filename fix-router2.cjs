const fs = require('fs');
const path = require('path');

const files = [
  'app/login/LoginClient.tsx',
  'app/reset-password/ResetPasswordClient.tsx',
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');

  if (!content.includes('next/navigation')) {
    content = content.replace(/"use client";/, '"use client";\nimport { useRouter } from "next/navigation";');
  } else if (!content.includes('useRouter')) {
    content = content.replace(/import\s+\{([^}]+)\}\s+from\s+['"]next\/navigation['"]/, 'import { $1, useRouter } from "next/navigation"');
  }

  fs.writeFileSync(filePath, content);
  console.log('Fixed', file);
});
