const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, searchRegex, replacement) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(searchRegex, replacement);
  fs.writeFileSync(filePath, content);
  console.log('Fixed', filePath);
}

replaceInFile(
  path.join(__dirname, 'server/routers/fpu.ts'),
  /\(ctx\.req\.headers\.origin as string\)/g,
  '(ctx.req.headers.get("origin") as string)'
);

replaceInFile(
  path.join(__dirname, 'server/routers/payment.ts'),
  /\(ctx\.req\.headers\.origin as string\)/g,
  '(ctx.req.headers.get("origin") as string)'
);
