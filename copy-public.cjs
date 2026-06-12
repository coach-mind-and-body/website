const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'client', 'public');
const destDir = path.join(__dirname, 'public');

if (fs.existsSync(srcDir)) {
  fs.cpSync(srcDir, destDir, { recursive: true, force: true });
  console.log('Successfully copied client/public to public');
} else {
  console.log('client/public does not exist');
}
