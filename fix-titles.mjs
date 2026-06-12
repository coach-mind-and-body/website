import fs from 'fs';
import path from 'path';

// Map of legacy page filenames to their new app directory paths
const pageMap = {
  'About.tsx': 'about',
  'Admin.tsx': 'admin',
  'Blog.tsx': 'health-wellness-blog',
  // BlogEditor and BlogPost need dynamic metadata, skipping automated for now
  'Book.tsx': 'book',
  'Disclaimer.tsx': 'disclaimer',
  'Enroll.tsx': 'enroll',
  'FPULandingPage.tsx': 'fpu-may-12',
  'FeelGreat.tsx': 'feel-great-system',
  'FinancialPeace.tsx': 'financial-peace',
  'FinancialPeaceThankYou.tsx': 'financial-peace/thank-you',
  'FoodQuiz.tsx': 'food-quiz',
  'FoodQuizThankYou.tsx': 'food-quiz-thank-you',
  'HabitTracker.tsx': 'habit-tracker',
  'Home.tsx': '', // root
  'JoinLanding.tsx': 'join',
  'JoinThankYou.tsx': 'join-thank-you',
  'Login.tsx': 'login',
  'MyProgram.tsx': 'my-program',
  'NotFound.tsx': '404',
  'Podcast.tsx': 'midlife-health-podcast',
  'Portal.tsx': 'portal',
  'Privacy.tsx': 'privacy',
  'Reclaim.tsx': 'reclaim',
  'ReclaimHub.tsx': 'portal/hub',
  'ResetPassword.tsx': 'reset-password',
  'SnackHackLeadGen.tsx': 'snack-hack',
  'Terms.tsx': 'terms'
};

const legacyDir = path.join(process.cwd(), 'client', 'src', 'pages');
const appDir = path.join(process.cwd(), 'app');

for (const [legacyFile, appRoute] of Object.entries(pageMap)) {
  const legacyPath = path.join(legacyDir, legacyFile);
  if (!fs.existsSync(legacyPath)) continue;

  const content = fs.readFileSync(legacyPath, 'utf8');
  
  // Extract title and description from usePageTitle
  const titleMatch = content.match(/title:\s*["']([^"']+)["']/);
  const descMatch = content.match(/description:\s*["']([^"']+)["']/);
  
  if (titleMatch) {
    const title = titleMatch[1];
    const desc = descMatch ? descMatch[1] : '';
    
    const pagePath = path.join(appDir, appRoute, 'page.tsx');
    if (fs.existsSync(pagePath)) {
      let pageContent = fs.readFileSync(pagePath, 'utf8');
      
      // If it already has metadata, replace it
      if (pageContent.includes('export const metadata')) {
        pageContent = pageContent.replace(/export const metadata.*?};\n/s, `export const metadata = {\n  title: "${title}",\n  description: "${desc}"\n};\n`);
      } else {
        // Prepend metadata
        pageContent = `export const metadata = {\n  title: "${title}",\n  description: "${desc}"\n};\n\n` + pageContent;
      }
      
      fs.writeFileSync(pagePath, pageContent);
      console.log(`Updated metadata for /${appRoute} -> ${title}`);
    }
  }
}
