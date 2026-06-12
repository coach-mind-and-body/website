const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = [
  ...walk(path.join(__dirname, 'components')),
  ...walk(path.join(__dirname, 'hooks')),
  ...walk(path.join(__dirname, 'lib')),
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  if (content.includes('import.meta.env.DEV')) {
    content = content.replace(/import\.meta\.env\.DEV/g, "(process.env.NODE_ENV !== 'production')");
    changed = true;
  }

  if (content.includes('import.meta.env.VITE_')) {
    content = content.replace(/import\.meta\.env\.VITE_/g, 'process.env.NEXT_PUBLIC_');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content);
    console.log('Fixed', file);
  }
});
