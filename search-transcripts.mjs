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
  console.log(`Found ${dirs.length} directories in brain.`);
  for (const dir of dirs) {
    const transcriptPath = path.join(brainDir, dir, '.system_generated', 'logs', 'transcript.jsonl');
    if (fs.existsSync(transcriptPath)) {
      console.log(`Searching transcript in ${dir}...`);
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
          const content = JSON.stringify(data.content || '') + JSON.stringify(data.tool_calls || '');
          if (content.toLowerCase().includes('video') || content.toLowerCase().includes('ad')) {
            // Check if it matches more specific user words: "ads" or "5 more"
            if (content.toLowerCase().includes('5 more') || content.toLowerCase().includes('ads')) {
              console.log(`Match in ${dir} Line ${lineNum} (Type: ${data.type}):`);
              console.log(data.content ? data.content.substring(0, 500) : JSON.stringify(data.tool_calls).substring(0, 500));
              console.log('---');
            }
          }
        } catch (e) {
          // ignore parse errors
        }
      }
    }
  }
}

search().catch(console.error);
