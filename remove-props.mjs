import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('page.tsx')) results.push(file);
    }
  });
  return results;
}

const pages = walk(path.join(process.cwd(), 'app'));

for (const page of pages) {
  let content = fs.readFileSync(page, 'utf8');
  if (content.includes('export default function Page(props: any) {') && content.includes('{...props}')) {
    content = content.replace('export default function Page(props: any) {', 'export default function Page() {');
    content = content.replace(/\{...props\}/g, '');
    fs.writeFileSync(page, content);
    console.log('Fixed', page);
  }
}
