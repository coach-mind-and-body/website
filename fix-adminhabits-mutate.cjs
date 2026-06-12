const fs = require('fs');
const path = require('path');

const destPath = path.join(__dirname, 'components/AdminHabitsTab.tsx');
let content = fs.readFileSync(destPath, 'utf8');

// Replace mutate calls to handle null description
content = content.replace(/updateMutation\.mutate\(\{ id: editing\.id, \.\.\.editing \}\);/g, 'updateMutation.mutate({ id: editing.id, title: editing.title, description: editing.description ?? undefined, order: editing.order, isActive: editing.isActive });');
content = content.replace(/createMutation\.mutate\(editing\);/g, 'createMutation.mutate({ title: editing.title, description: editing.description ?? undefined, order: editing.order, isActive: editing.isActive });');

fs.writeFileSync(destPath, content);
console.log('Fixed mutate calls in AdminHabitsTab.tsx');
