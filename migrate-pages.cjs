const fs = require('fs');
const path = require('path');

const pageMapping = {
  "Home.tsx": "",
  "About.tsx": "about",
  "Reclaim.tsx": "reclaim",
  "Book.tsx": "book",
  "Blog.tsx": "health-wellness-blog",
  "BlogPost.tsx": "health-wellness-blog/[slug]",
  "FoodQuiz.tsx": "food-quiz",
  "FoodQuizThankYou.tsx": "food-quiz-thank-you",
  "FeelGreat.tsx": "feel-great-system", // Also /unicity but we can redirect later
  "Terms.tsx": "terms",
  "Privacy.tsx": "privacy",
  "Disclaimer.tsx": "disclaimer",
  "JoinLanding.tsx": "join",
  "JoinThankYou.tsx": "join-thank-you",
  "FinancialPeace.tsx": "financial-peace", // Also fpu, financial-peace-university
  "FinancialPeaceThankYou.tsx": "financial-peace/thank-you",
  "FPULandingPage.tsx": "fpu-may-12",
  "Podcast.tsx": "midlife-health-podcast",
  "Login.tsx": "login",
  "ResetPassword.tsx": "reset-password",
  "SnackHackLeadGen.tsx": "snack-hack", // Also free-guide
  "HabitTracker.tsx": "habit-tracker",
  "Glp1Recovery.tsx": "life-after-glp-1",
  "HolisticHealth.tsx": "holistic-health-and-wellness",
  "Enroll.tsx": "enroll",
  "MyProgram.tsx": "my-program",
  "Portal.tsx": "portal",
  "ReclaimHub.tsx": "portal/hub",
  "Admin.tsx": "admin",
  "BlogEditor.tsx": "admin/blog/new", // Will need manual fix for [id]
  "NotFound.tsx": "404"
};

const srcDir = path.join(__dirname, 'client', 'src', 'pages');
const appDir = path.join(__dirname, 'app');

function extractMetadata(content) {
  const titleMatch = content.match(/title:\s*["']([^"']+)["']/);
  const descMatch = content.match(/description:\s*["']([^"']+)["']/);
  const keywordMatch = content.match(/keywords:\s*["']([^"']+)["']/);
  
  if (!titleMatch) return null;
  
  return {
    title: titleMatch[1],
    description: descMatch ? descMatch[1] : "",
    keywords: keywordMatch ? keywordMatch[1] : ""
  };
}

function processPage(filename, routePath) {
  const filePath = path.join(srcDir, filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Extract metadata
  const metadata = extractMetadata(content);
  
  // Remove usePageTitle import and call
  content = content.replace(/import\s+\{\s*usePageTitle\s*\}\s+from\s+["'][^"']+["'];?\n?/g, '');
  content = content.replace(/usePageTitle\(\s*\{[\s\S]*?\}\s*\);?/g, '');
  
  // Replace wouter Link with next/link
  content = content.replace(/import\s+\{([^}]*?)Link([^}]*?)\}\s+from\s+["']wouter["']/g, (match, p1, p2) => {
    // If wouter imported other things, keep them
    const otherImports = [p1, p2].join('').trim().replace(/^,|,$/g, '').trim();
    let res = `import Link from 'next/link';\n`;
    if (otherImports) {
      res += `import { ${otherImports} } from 'wouter';\n`;
    }
    return res;
  });
  
  // Adjust useLocation from wouter to usePathname from next/navigation
  if (content.includes('useLocation')) {
    content = content.replace(/import\s+\{([^}]*?)useLocation([^}]*?)\}\s+from\s+["']wouter["']/g, (match, p1, p2) => {
      const otherImports = [p1, p2].join('').trim().replace(/^,|,$/g, '').trim();
      let res = `import { usePathname } from 'next/navigation';\n`;
      if (otherImports) {
        res += `import { ${otherImports} } from 'wouter';\n`;
      }
      return res;
    });
    // Replace const [location] = useLocation() with const location = usePathname()
    content = content.replace(/const\s+\[(.*?)\]\s*=\s*useLocation\(\)/g, "const $1 = usePathname()");
  }

  // Prepend "use client"
  content = `"use client";\n\n` + content;
  
  // Create directories
  const targetDir = path.join(appDir, routePath);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  
  // Write Client Component
  const clientComponentName = filename.replace('.tsx', 'Client');
  fs.writeFileSync(path.join(targetDir, `${clientComponentName}.tsx`), content);
  
  // Write Server Component (page.tsx)
  let pageContent = `import ${clientComponentName} from './${clientComponentName}';\n\n`;
  
  if (metadata) {
    pageContent += `export const metadata = {
  title: ${JSON.stringify(metadata.title)},
  description: ${JSON.stringify(metadata.description)},
  keywords: ${JSON.stringify(metadata.keywords)}
};\n\n`;
  }
  
  pageContent += `export default function Page(props: any) {
  return <${clientComponentName} {...props} />;
}\n`;

  fs.writeFileSync(path.join(targetDir, 'page.tsx'), pageContent);
  console.log(`Migrated ${filename} to app/${routePath}/page.tsx`);
}

for (const [filename, routePath] of Object.entries(pageMapping)) {
  processPage(filename, routePath);
}
