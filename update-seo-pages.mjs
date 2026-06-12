import fs from 'fs';
import path from 'path';

const pages = [
  {
    path: 'app/page.tsx',
    title: 'Health and Wellness Coach | Mind and Body Reset',
    description: 'Certified life and health coach Lee Anne Chapman helps women 40+ reclaim their body, rewire their mind, and reset their life through holistic wellness coaching.',
    url: '/'
  },
  {
    path: 'app/about/page.tsx',
    title: 'About Lee Anne Chapman | Mind and Body Reset',
    description: 'Meet Lee Anne Chapman — certified life and health coach helping women 40+ navigate midlife health, hormonal changes, and food freedom from the Wasatch Front, Utah.',
    url: '/about'
  },
  {
    path: 'app/reclaim/page.tsx',
    title: 'R.E.C.L.A.I.M. Coaching Program | Mind and Body Reset',
    description: 'R.E.C.L.A.I.M. is a 6-session 1:1 coaching program for women 40+ ready to break free from diet culture, balance hormones, and build lasting health habits.',
    url: '/reclaim'
  },
  {
    path: 'app/financial-peace/page.tsx',
    title: 'Financial Peace University | Mind and Body Reset',
    description: "Join Lee Anne's Financial Peace University group — Dave Ramsey's proven plan for budgeting, eliminating debt, and building wealth. Next cohort starts soon.",
    url: '/financial-peace'
  },
  {
    path: 'app/midlife-health-podcast/page.tsx',
    title: 'Mind and Body Reset Podcast | Lee Anne Chapman',
    description: 'Listen to the Mind and Body Reset podcast where we talk real strategy for midlife health, hormones, weight loss, and mindset shifts for women 40+.',
    url: '/midlife-health-podcast'
  },
  {
    path: 'app/health-wellness-blog/page.tsx',
    title: 'Health & Wellness Blog | Mind & Body Reset',
    description: 'Articles on midlife wellness, nutrition, hormones, mindset, body image, and food freedom for women 40+ by certified coach Lee Anne Chapman.',
    url: '/health-wellness-blog'
  },
  {
    path: 'app/food-quiz/page.tsx',
    title: 'Free Food & Mindset Quiz | Mind and Body Reset',
    description: "Take this free 60-second quiz to discover what's really keeping you stuck with food and get personalized insights for your midlife health journey.",
    url: '/food-quiz'
  },
  {
    path: 'app/unicity/page.tsx',
    title: 'Unicity Feel Great System | Mind and Body Reset',
    description: 'Discover the Unicity Feel Great System — a simple, science-backed approach to intermittent fasting and metabolic health. Shop Unimate and Balance.',
    url: '/unicity'
  }
];

for (const page of pages) {
  const fullPath = path.resolve(page.path);
  if (!fs.existsSync(fullPath)) continue;

  let content = fs.readFileSync(fullPath, 'utf-8');

  const regex = /export const metadata(?:[\s\S]*?)= \{[\s\S]*?\};/;
  
  const newMetadata = `export const metadata = {
  title: ${JSON.stringify(page.title)},
  description: ${JSON.stringify(page.description)},
  openGraph: {
    title: ${JSON.stringify(page.title)},
    description: ${JSON.stringify(page.description)},
    url: ${JSON.stringify(page.url)},
  },
  twitter: {
    title: ${JSON.stringify(page.title)},
    description: ${JSON.stringify(page.description)},
  }
};`;

  if (regex.test(content)) {
    content = content.replace(regex, newMetadata);
    fs.writeFileSync(fullPath, content, 'utf-8');
    console.log('Updated', page.path);
  }
}
