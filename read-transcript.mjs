import fs from 'fs';
import readline from 'readline';

async function extractLastUserMessage() {
  const filePath = 'C:\\Users\\carte\\.gemini\\antigravity\\brain\\ce64e255-e961-44f4-898e-e25ad9a95304\\.system_generated\\logs\\transcript.jsonl';
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let lastUserMsg = null;
  for await (const line of rl) {
    if (!line.trim()) continue;
    const data = JSON.parse(line);
    if (data.type === 'USER_INPUT' && data.source === 'USER_EXPLICIT') {
      lastUserMsg = data.content;
    }
  }
  
  if (lastUserMsg) {
    fs.writeFileSync('missing_posts_raw.txt', lastUserMsg);
    console.log('Saved last user message to missing_posts_raw.txt');
  } else {
    console.log('No user message found.');
  }
}

extractLastUserMessage().catch(console.error);
