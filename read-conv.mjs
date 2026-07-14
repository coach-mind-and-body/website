import fs from 'fs';
import path from 'path';
import readline from 'readline';

const brainDir = 'C:\\Users\\carte\\.gemini\\antigravity\\brain';
const dirName = '51372f38-4e72-47f4-b98d-5bd41299116b';

async function read() {
  const transcriptPath = path.join(brainDir, dirName, '.system_generated', 'logs', 'transcript.jsonl');
  if (!fs.existsSync(transcriptPath)) {
    console.log('Transcript not found at', transcriptPath);
    return;
  }
  const fileStream = fs.createReadStream(transcriptPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const out = [];
  let lineNum = 0;
  for await (const line of rl) {
    lineNum++;
    if (!line.trim()) continue;
    try {
      const data = JSON.parse(line);
      if (data.type === 'USER_INPUT' || data.type === 'PLANNER_RESPONSE') {
        const text = data.content || '';
        if (text.toLowerCase().includes('video') || text.toLowerCase().includes('ad') || Math.abs(lineNum - 1480) < 50) {
          out.push(`[Line ${lineNum}] [${data.type}] (${data.source || ''}):`);
          out.push(text);
          out.push('-'.repeat(40));
        }
      }
    } catch (e) {}
  }
  fs.writeFileSync('conv-output.txt', out.join('\n'));
  console.log('Wrote output to conv-output.txt');
}

read().catch(console.error);
