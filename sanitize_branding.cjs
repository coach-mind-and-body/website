const fs = require('fs');

const filesToFix = [
  "app/admin/inbox/components/InboxSidebar.tsx",
  "app/admin/inbox/components/NewChatComposeModal.tsx",
  "components/pages/crm/Campaigns.tsx",
  "server/crm/automations.ts",
  "server/crm/reviewSequenceEnrollment.ts",
  "server/crm/smsHandlers.ts",
  "server/crm/templates.ts",
  "server/crm/voiceHandlers.ts",
  "server/routers/messaging.ts",
  "app/admin/inbox/settings/page.tsx",
  "server/crm/ai.ts",
  "server/crm/handlers/webchatHandlers.ts"
];

for (const file of filesToFix) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/utahtravelpros/gi, 'coachmindandbody');
    content = content.replace(/Utah Travel Pros/gi, 'Mind and Body');
    fs.writeFileSync(file, content, 'utf8');
  }
}
console.log("Branding sanitized.");
