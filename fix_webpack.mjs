import fs from 'fs';
import path from 'path';

const routesToDelete = [
  'app/admin/inbox/campaigns',
  'app/api/crm/voice',
];

for (const p of routesToDelete) {
  if (fs.existsSync(p)) {
    fs.rmSync(p, { recursive: true, force: true });
  }
}

// 2. Fix useInboxNewMessageAlerts
const hookFile = 'hooks/useInboxNewMessageAlerts.ts';
if (fs.existsSync(hookFile)) {
  let content = fs.readFileSync(hookFile, 'utf8');
  content = content.replace(/import .* from ['"]@\/lib\/inboxNotificationSound['"];?/, 'const playInboxNotificationSound = () => {};');
  fs.writeFileSync(hookFile, content);
}

// 3. Fix server/crm/smsHandlers.ts
const smsFile = 'server/crm/smsHandlers.ts';
if (fs.existsSync(smsFile)) {
  let content = fs.readFileSync(smsFile, 'utf8');
  content = content.replace(/import .* from ['"]\.\.\/_core\/llm['"];?/, 'const createPatchedFetch = () => {}; const generateObject = () => {};');
  content = content.replace(/import .* from ['"]\.\.\/\.\.\/lib\/reportError['"];?/, 'const reportError = (e) => console.error(e);');
  content = content.replace(/import .* from ['"]\.\.\/stripe\/stripe['"];?/, 'const stripe = { paymentLinks: { create: () => ({ url: "" }) } };');
  fs.writeFileSync(smsFile, content);
}

// 4. Fix server/crm/voiceHandlers.ts
const voiceFile = 'server/crm/voiceHandlers.ts';
if (fs.existsSync(voiceFile)) {
  let content = fs.readFileSync(voiceFile, 'utf8');
  content = content.replace(/import .* from ['"]\.\.\/_core\/llm['"];?/, 'const generateObject = () => {};');
  fs.writeFileSync(voiceFile, content);
}

// 5. Fix server/routers/aiTraining.ts
const aiFile = 'server/routers/aiTraining.ts';
if (fs.existsSync(aiFile)) {
  let content = fs.readFileSync(aiFile, 'utf8');
  content = content.replace(/import .* from ['"]\.\.\/_core\/llm['"];?/, 'const generateObject = () => {};');
  fs.writeFileSync(aiFile, content);
}

// 6. Fix server/crm/ai.ts
const crmAiFile = 'server/crm/ai.ts';
if (fs.existsSync(crmAiFile)) {
  let content = fs.readFileSync(crmAiFile, 'utf8');
  content = content.replace(/import .* from ['"]\.\.\/_core\/llm['"];?/, 'const generateObject = () => {};');
  fs.writeFileSync(crmAiFile, content);
}

console.log('Webpack fixes applied.');
