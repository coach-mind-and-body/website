import fs from 'fs';
import path from 'path';
import readline from 'readline';

const brainDir = 'C:\\Users\\carte\\.gemini\\antigravity\\brain';

async function search() {
  if (!fs.existsSync(brainDir)) {
    console.log('Brain directory does not exist:', brainDir);
    return;
  }
  const dirs = fs.readdirSync(brainDir);
  for (const dir of dirs) {
    const transcriptPath = path.join(brainDir, dir, '.system_generated', 'logs', 'transcript.jsonl');
    if (fs.existsSync(transcriptPath)) {
      const fileStream = fs.createReadStream(transcriptPath);
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
      });

      let lineNum = 0;
      for await (const line of rl) {
        lineNum++;
        if (!line.trim()) continue;
        try {
          const data = JSON.parse(line);
          const content = (data.content || '').toLowerCase();
          
          // Let's check for the exact phrases the user mentioned:
          // "5 more videos", "five more videos", "5 more", "five more" with "video" or "ad"
          const hasFiveMore = content.includes('5 more') || content.includes('five more');
          const hasVideo = content.includes('video');
          const hasAd = content.includes('ad');

          if (hasFiveMore && (hasVideo || hasAd)) {
            console.log(`[MATCH] Dir: ${dir}, Line: ${lineNum}, Type: ${data.type}`);
            console.log(`Content:\n${data.content}\n`);
            console.log('='.repeat(50));
          }
        } catch (e) {
          // ignore
        }
      }
    }
  }
}

search().catch(console.error);
