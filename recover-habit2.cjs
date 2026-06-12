const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, 'client/src/pages/HabitTracker.tsx');
let content = fs.readFileSync(srcPath, 'utf8');

// Replace wouter
content = content.replace(/import\s+\{\s*useLocation\s*\}\s+from\s+["']wouter["'];/g, 'import { useRouter } from "next/navigation";');
content = content.replace(/import\s+\{\s*Link\s*\}\s+from\s+["']wouter["'];/g, 'import Link from "next/link";');
content = content.replace(/const\s+\[,\s*setLocation\]\s*=\s*useLocation\(\);/g, 'const router = useRouter();');
content = content.replace(/setLocation\(/g, 'router.push(');

// Add description to LocalHabit
content = content.replace(/type\s+LocalHabit\s*=\s*\{\s*id:\s*number;\s*title:\s*string;\s*isActive:\s*boolean;\s*\};/g, 'type LocalHabit = { id: number; title: string; description?: string; isActive: boolean; };');

// Change export name
content = content.replace(/export default function HabitTracker/g, 'export default function HabitTrackerClient');

// Fix paths
content = content.replace(/@\/_core\/hooks\/useAuth/g, '@/hooks/use-auth');
content = content.replace(/@\/_core\/hooks\/useWebPush/g, '@/hooks/useWebPush');
content = content.replace(/@\/_core\/lib\/deviceId/g, '@/lib/deviceId');

// Add "use client" directive
content = '"use client";\n\n' + content;

const destPath = path.join(__dirname, 'app/habit-tracker/HabitTrackerClient.tsx');
fs.writeFileSync(destPath, content);
console.log('Restored and fixed HabitTrackerClient');
