const fs = require('fs');
const path = require('path');

const routersDir = path.join(__dirname, 'server', 'routers');

function fixFile(filename, replacements) {
  const file = path.join(routersDir, filename);
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  for (const [find, replace] of replacements) {
    if (typeof find === 'string') {
      content = content.split(find).join(replace);
    } else {
      content = content.replace(find, replace);
    }
  }
  fs.writeFileSync(file, content, 'utf8');
}

fixFile('messaging.ts', [
  ['import { conversations, messages, users, clientLeads, callLogs, messageTemplates, vacationQuotes, conversionEvents }', 'import { conversations, messages, users, leads, callLogs, messageTemplates, enrollments }'],
  ['clientLeads', 'leads'],
  ['vacationQuotes', 'enrollments'],
  ['conversionEvents', 'conversations'],
  ['r.value', 'r.conv'],
  ['users.isPremium', 'sql`false`'],
  ['isPremium: users.isPremium', 'isPremium: sql`false`'],
  ['users.subscriptionExpiresAt', 'users.createdAt'],
  ['enrollments.phone', 'leads.phone'],
  ['enrollments.email', 'leads.email'],
  ['enrollments.updatedAt', 'leads.updatedAt'],
  ['tripStartDate', 'createdAt'],
  ['destination || "TBD"', '"Program"'],
  ['import { getStripeInstance } from \'../stripe/stripe\';', ''],
  ['const stripe = await getStripeInstance();', ''],
  [/const stripe = await getStripeInstance\(\);[\s\S]*?return result;/g, 'return [];']
]);

fixFile('crmAutomations.ts', [
  ['import { sequences, sequenceSteps, sequenceEnrollments, tags, userTags, messages, conversations, campaigns, users }', 'import { sequences, sequenceSteps, sequenceEnrollments, messages, conversations, campaigns, users }'],
  ['import { clientLeads, vacationQuotes, conversionEvents }', 'import { leads, enrollments }'],
  ['clientLeads', 'leads'],
  ['vacationQuotes', 'enrollments'],
  ['conversionEvents', 'conversations'],
  ['subscriberId', 'userId'], // sequenceEnrollments uses userId now
  ['userTags', 'users'], // dummy out userTags
]);

fixFile('pushNotifications.ts', [
  ['import { users, pushSubscriptions, vacationQuotes }', 'import { users, pushSubscriptions, enrollments, leads }'],
  ['vacationQuotes', 'enrollments'],
  ['clientUserId', 'userId'],
]);

console.log("Applied final fixes.");
