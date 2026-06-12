const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, 'app/health-wellness-blog/BlogClient.tsx');
let content = fs.readFileSync(srcPath, 'utf8');

// Replace Helmet import with usePageTitle
content = content.replace(/import \{ Helmet \} from "react-helmet-async";/g, 'import { usePageTitle } from "@/hooks/usePageTitle";');

// Remove Helmet JSX block entirely
content = content.replace(/<Helmet>[\s\S]*?<\/Helmet>/g, '');

// Call the hook inside the component
content = content.replace(/export default function Blog\(\) \{/g, 'export default function Blog() {\n  usePageTitle({ title: "Health & Wellness Blog | Mind & Body Reset", description: "Read the latest insights on midlife health, mindset, and weight loss from Lee Anne Chapman." });\n');

fs.writeFileSync(srcPath, content);
console.log('Fixed BlogClient.tsx');
