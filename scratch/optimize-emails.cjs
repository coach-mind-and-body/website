const fs = require("fs");
const path = require("path");

const resultsPath = path.join(__dirname, "../server/emails/foodQuizResults.ts");
const nurturePath = path.join(__dirname, "../server/emails/foodQuizNurture.ts");

let resultsContent = fs.readFileSync(resultsPath, "utf-8");
let nurtureContent = fs.readFileSync(nurturePath, "utf-8");

// 1. CTA Button Optimizations
const oldBtnColor = 'bgcolor="#3e5446"';
const newBtnColor = 'bgcolor="#c9a96e"';
const oldBtnRadius = 'border-radius:10px;';
const newBtnRadius = 'border-radius:9999px;';
const oldBtnPadding = 'padding:14px 18px;';
const newBtnPadding = 'padding:14px 36px;';

function optimizeButtons(html) {
  let c = html;
  c = c.replaceAll(oldBtnColor, newBtnColor);
  c = c.replaceAll(oldBtnRadius, newBtnRadius);
  c = c.replaceAll(oldBtnPadding, newBtnPadding);
  return c;
}

// 2. Personalization
function personalize(html) {
  return html.replaceAll('Hi there,', 'Hi ${firstName},');
}

resultsContent = optimizeButtons(resultsContent);
resultsContent = personalize(resultsContent);
nurtureContent = personalize(nurtureContent);

// 3. Subject Line Punch-Ups
nurtureContent = nurtureContent.replace(
  'subject: "I didn’t recognize myself anymore"',
  'subject: "I didn’t recognize myself anymore... 😔"'
);
nurtureContent = nurtureContent.replace(
  'subject: "3 small shifts that calm food fear"',
  'subject: "3 quick wins to calm food fear today 🌿"'
);
nurtureContent = nurtureContent.replace(
  'subject: "3 lies that keep women stuck with food"',
  'subject: "3 lies keeping you stuck with food 🛑"'
);
nurtureContent = nurtureContent.replace(
  'subject: "The day I felt completely defeated"',
  'subject: "The day I almost gave up (and why I didn\'t) 💛"'
);
nurtureContent = nurtureContent.replace(
  'subject: "When I almost gave up (and why I didn’t)"', // wait the subjects are out of order from original. Let's just do targeted replaces on what we have.
  'subject: "When I almost gave up (and why I didn’t) 💛"'
);
nurtureContent = nurtureContent.replace(
  'subject: "I didn’t change everything. I didn’t give up."',
  'subject: "I didn’t change everything. (But this changed my life) ✨"'
);
nurtureContent = nurtureContent.replace(
  'subject: "You don’t have to do this alone"',
  'subject: "You don’t have to do this alone (Your Invitation) 💌"'
);

// 4. Inject PS with CTA into Nurture Emails
// We want to find the signature block and insert the CTA right before it.
// Signature block starts with:
// <p style="margin:18px 0 0; font-size:16px; line-height:1.7;">
// With you,<br>
// 💛 LeeAnne
// </p>

const signatureRegex = /<p style="margin:18px 0 0; font-size:16px; line-height:1.7;">\s*With you,<br>\s*💛 LeeAnne\s*<\/p>/g;

const ctaHTML = `
                  <div style="margin: 32px 0; text-align: center; border-top: 1px solid #eeeeee; padding-top: 32px;">
                    <p style="margin:0 0 16px; font-size:16px; line-height:1.7; color:#333333;">
                      <strong>P.S. Ready to find a rhythm that actually works?</strong>
                    </p>
                    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 10px;">
                      <tr>
                        <td align="center" bgcolor="#c9a96e" style="border-radius:9999px;">
                          <a href="https://mindandbodyresetcoach.com/ola/services/consultation" style="display:inline-block; padding:14px 36px; font-family:Arial, Helvetica, sans-serif; font-size:16px; color:#ffffff; text-decoration:none; font-weight:700;">
                            Book Your Free Clarity Call
                          </a>
                        </td>
                      </tr>
                    </table>
                  </div>
`;

nurtureContent = nurtureContent.replace(signatureRegex, (match) => {
  return ctaHTML + match;
});

fs.writeFileSync(resultsPath, resultsContent);
fs.writeFileSync(nurturePath, nurtureContent);

console.log("Emails optimized successfully!");
