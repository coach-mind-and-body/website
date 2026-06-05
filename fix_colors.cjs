const fs = require('fs');
let content = fs.readFileSync('client/src/pages/ReclaimHub.tsx', 'utf8');

// Colors
content = content.replace(/oklch\(0\.98 0\.01 75\)/g, '#faf5f5'); // background
content = content.replace(/oklch\(0\.38 0\.08 148\)/g, '#c9a96e'); // buttons/accents gold
content = content.replace(/oklch\(0\.28 0\.05 148\)/g, '#2d3b2d'); // dark green
content = content.replace(/oklch\(0\.45 0\.02 75\)/g, '#5a6b5a'); // medium green
content = content.replace(/oklch\(0\.95 0\.04 148\)/g, '#fbeee9'); // blush pink
content = content.replace(/oklch\(0\.92 0\.02 75\)/g, '#f0e8e4'); // borders
content = content.replace(/oklch\(0\.97 0\.02 75\)/g, '#fbeee9'); // light pink
content = content.replace(/oklch\(0\.90 0\.02 75\)/g, '#e8c99a'); // border gold
content = content.replace(/oklch\(0\.60 0\.12 75\)/g, '#c9a96e'); // gold
content = content.replace(/oklch\(0\.60 0\.12 148\)/g, '#8a9a8a'); // muted text
content = content.replace(/oklch\(0\.85 0\.02 75\)/g, '#f0e8e4'); // border
content = content.replace(/oklch\(0\.55 0\.02 75\)/g, '#8a9a8a'); // muted

// YouTube Embed fix
const youtubeHelper = `
function getEmbedUrl(url: string) {
  if (!url) return url;
  if (url.includes('youtube.com/watch?v=')) {
    const videoId = new URL(url).searchParams.get('v');
    if (videoId) return \`https://www.youtube.com/embed/\${videoId}\`;
  }
  if (url.includes('youtu.be/')) {
    const videoId = url.split('youtu.be/')[1]?.split('?')[0];
    if (videoId) return \`https://www.youtube.com/embed/\${videoId}\`;
  }
  return url;
}
`;

if (!content.includes('function getEmbedUrl')) {
  content = content.replace('export default function ReclaimHub() {', youtubeHelper + '\nexport default function ReclaimHub() {');
  content = content.replace('src={selectedModule.videoUrl}', 'src={getEmbedUrl(selectedModule.videoUrl)}');
}

fs.writeFileSync('client/src/pages/ReclaimHub.tsx', content);
console.log('ReclaimHub.tsx updated!');
