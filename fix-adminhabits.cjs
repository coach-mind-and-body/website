const fs = require('fs');
const path = require('path');

const destPath = path.join(__dirname, 'components/AdminHabitsTab.tsx');
let content = fs.readFileSync(destPath, 'utf8');

// Allow string | null for description in state
content = content.replace(/description:\s*string;/g, 'description: string | null;');

// Handle null in input value
content = content.replace(/value=\{editing\.description\}/g, 'value={editing.description || ""}');

// Only pass required fields to setEditing
content = content.replace(/setEditing\(t\)/g, 'setEditing({ id: t.id, title: t.title, description: t.description, order: t.order, isActive: t.isActive })');

fs.writeFileSync(destPath, content);
console.log('Fixed AdminHabitsTab.tsx');
