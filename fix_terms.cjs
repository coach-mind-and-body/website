const fs = require('fs');
const file = 'app/terms/TermsClient.tsx';
let content = fs.readFileSync(file, 'utf8');

const replacement = `  {
    title: "5. Intellectual Property",
    body: "All content on this website is the property of Mind and Body Reset and may not be copied, distributed, or reused without written permission.",
  },
  {
    title: "6. SMS & Communications",
    body: "By providing a phone number, you agree to receive SMS communications from us. Consent is not a condition of purchase. Message and data rates may apply. Reply STOP to cancel or HELP for assistance. Mobile information will not be shared with third parties/affiliates for marketing/promotional purposes.",
  },
];`;

content = content.replace(/  \{\r?\n    title: "5\. Intellectual Property",\r?\n    body: "All content on this website is the property of Mind and Body Reset and may not be copied, distributed, or reused without written permission\.",\r?\n  \},\r?\n\];/m, replacement);

fs.writeFileSync(file, content, 'utf8');
