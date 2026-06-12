const fs = require('fs');
const path = require('path');

const destPath = path.join(__dirname, 'lib/const.ts');
let content = fs.readFileSync(destPath, 'utf8');

content = content.replace(/const oauthPortalUrl = process\.env\.NEXT_PUBLIC_OAUTH_PORTAL_URL;/g, 'const oauthPortalUrl = process.env.NEXT_PUBLIC_OAUTH_PORTAL_URL || "";');
content = content.replace(/const appId = process\.env\.NEXT_PUBLIC_APP_ID;/g, 'const appId = process.env.NEXT_PUBLIC_APP_ID || "";');

fs.writeFileSync(destPath, content);
console.log('Fixed lib/const.ts');
