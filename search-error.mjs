import fs from 'fs';
import path from 'path';

function search(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      search(fullPath);
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.mjs') || fullPath.endsWith('.cjs')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('Neither apiKey nor config.authenticator provided')) {
        console.log('Found in', fullPath);
      }
    }
  }
}

search('./node_modules');
