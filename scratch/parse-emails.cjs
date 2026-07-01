const fs = require("fs");
const path = require("path");

const textFile = "C:\\Users\\carte\\Downloads\\Mind and Body Emails.txt";
const content = fs.readFileSync(textFile, "utf-8");

const parts = content.split(/<!DOCTYPE html/i);

// parts[0] is the intro text
// parts[1] is Rebalancer
// parts[2] is Doer
// parts[3] is Achiever
// parts[4] is Feeler
// But wait, there are also "Nurture Email 1" etc between the HTML blocks.
// Let's split by "<!DOCTYPE" and then keep the DOCTYPE.

const allHtmlBlocks = [];
let currentHTML = "";
let currentType = "";

const lines = content.split('\n');
let blockCount = 0;
let htmlBuffer = [];
let inHtml = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.trim().toLowerCase().startsWith("<!doctype")) {
    if (inHtml) {
      allHtmlBlocks.push(htmlBuffer.join('\n'));
      htmlBuffer = [];
    }
    inHtml = true;
  }
  
  if (inHtml) {
    htmlBuffer.push(line);
  }
}
if (htmlBuffer.length > 0) {
  allHtmlBlocks.push(htmlBuffer.join('\n'));
}

const htmlBlocks = allHtmlBlocks.filter(block => block.trim().length > 150);

console.log("Found HTML blocks:", htmlBlocks.length);

function replaceMergeTags(html) {
  let cleaned = html.replace(/\*\|FNAME\|\*/g, "${firstName}");
  cleaned = cleaned.replace(/\*\|UPDATE_PROFILE\|\*/g, "${ENV.appPublicUrl}");
  cleaned = cleaned.replace(/\*\|UNSUB\|\*/g, "${ENV.appPublicUrl}");
  cleaned = cleaned.replace(/\*\|LIST:ADDRESSLINE\|\*/g, "");
  // fix template literal issues
  cleaned = cleaned.replace(/`/g, "\\`");
  cleaned = cleaned.replace(/\\\$/g, "$$"); // Fix accidentally escaping $
  return cleaned;
}

const rebalancer = replaceMergeTags(htmlBlocks[0]);
const doer = replaceMergeTags(htmlBlocks[1]);
const achiever = replaceMergeTags(htmlBlocks[2]);
const feeler = replaceMergeTags(htmlBlocks[3]);

const resultsFile = `import { ENV } from "../_core/env";

export const getFoodQuizRebalancerEmail = (firstName: string) => ({
  subject: "Your Calm Body Reset Results",
  html: \`${rebalancer}\`
});

export const getFoodQuizDoerEmail = (firstName: string) => ({
  subject: "Your Calm Body Reset Results",
  html: \`${doer}\`
});

export const getFoodQuizAchieverEmail = (firstName: string) => ({
  subject: "Your Calm Body Reset Results",
  html: \`${achiever}\`
});

export const getFoodQuizFeelerEmail = (firstName: string) => ({
  subject: "Your Calm Body Reset Results",
  html: \`${feeler}\`
});
`;

fs.writeFileSync(path.join(__dirname, "../server/emails/foodQuizResults.ts"), resultsFile);
console.log("Wrote foodQuizResults.ts");

let nurtureFile = `import { ENV } from "../_core/env";\n\n`;

const subjects = [
  "I didn’t recognize myself anymore",
  "3 small shifts that calm food fear",
  "3 lies that keep women stuck with food",
  "The day I felt completely defeated",
  "When I almost gave up (and why I didn’t)",
  "Proof it's possible for you too",
  "The Invitation"
];

for (let i = 4; i < htmlBlocks.length; i++) {
  const nurtureHtml = replaceMergeTags(htmlBlocks[i]);
  const idx = i - 3; // 1-indexed for nurture emails
  const subject = subjects[idx - 1] || "Nurture Email " + idx;
  
  nurtureFile += "export const getFoodQuizNurtureEmail" + idx + " = (firstName: string) => ({\n" +
  "  subject: \"" + subject + "\",\n" +
  "  html: `" + nurtureHtml + "`\n" +
  "});\n\n";
}

nurtureFile += "\nexport const FOOD_QUIZ_NURTURE_EMAILS = [\n";
for (let i = 4; i < htmlBlocks.length; i++) {
  nurtureFile += "  getFoodQuizNurtureEmail" + (i - 3) + ",\n";
}
nurtureFile += "];\n";

fs.writeFileSync(path.join(__dirname, "../server/emails/foodQuizNurture.ts"), nurtureFile);
console.log("Wrote foodQuizNurture.ts");
