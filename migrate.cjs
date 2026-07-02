const fs = require('fs');
const path = require('path');

const routersDir = path.join(__dirname, 'server', 'routers');

const replacements = [
  // Schema imports
  [/clientLeads/g, 'leads'],
  [/vacationQuotes/g, 'enrollments'],
  [/conversionEvents,?/g, ''], // Remove conversionEvents
  [/clientUploads,?/g, ''],
  [/itineraries,?/g, ''],
  [/trips,?/g, ''],

  // Variables/Columns
  [/leadName: leads\.name/g, 'leadName: leads.name'],
  [/isPremium: users\.isPremium,?/g, ''],
  [/isPremium: r\.isPremium \|\| existing\.isPremium,/g, ''],
  [/if \(\!existing\.isPremium\) existing\.isPremium \= r\.isPremium;/g, ''],
  [/users\.isPremium/g, 'false'], // Stub
  [/users\.subscriptionExpiresAt/g, 'users.createdAt'], // Stub
  [/enrollments\.phone/g, 'leads.phone'],
  [/enrollments\.email/g, 'leads.email'],
  [/enrollments\.updatedAt/g, 'leads.updatedAt'],
  [/tripStartDate/g, 'createdAt'], // Stub for now
  [/destination \|\| "TBD"/g, '"Program"'],
  [/\.\.\/crm\//g, '../'], // Fix paths if needed

  // Auth/Paths
  [/\@\/_core\/hooks/g, '@/hooks'],
  [/\@\/_core\/components/g, '@/components'],
  [/\@\/_core\/lib/g, '@/lib'],
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  for (const [regex, replacement] of replacements) {
    content = content.replace(regex, replacement);
  }
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Processed ${filePath}`);
}

const routersToProcess = [
  'messaging.ts',
  'crmAutomations.ts',
  'templates.ts',
  'aiTraining.ts',
  'push.ts',
  'pushNotifications.ts'
];

for (const file of routersToProcess) {
  const filePath = path.join(routersDir, file);
  if (fs.existsSync(filePath)) {
    processFile(filePath);
  }
}
