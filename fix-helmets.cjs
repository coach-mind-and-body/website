const fs = require('fs');
const path = require('path');

const files = [
  'app/holistic-health-and-wellness/HolisticHealthClient.tsx',
  'app/life-after-glp-1/Glp1RecoveryClient.tsx',
  'app/snack-hack/SnackHackLeadGenClient.tsx',
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');

  // Remove the Helmet import
  content = content.replace(/import\s+\{\s*Helmet\s*\}\s+from\s+["']react-helmet-async["'];?/g, '');

  // Remove the <Helmet> ... </Helmet> block
  content = content.replace(/<Helmet>[\s\S]*?<\/Helmet>/g, '');

  fs.writeFileSync(filePath, content);
  console.log('Fixed', file);
});
