const fs = require('fs');
const path = 'c:/Users/carte/Downloads/mind-body-reset-portal/client/src/pages/FinancialPeace.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Remove FpuSignUpForm component
const startMarker = "function FpuSignUpForm({";
const endMarker = "function CoachingCheckoutButton({";
const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);
if (startIndex !== -1 && endIndex !== -1) {
  content = content.slice(0, startIndex) + content.slice(endIndex);
}

// 2. Replace <FpuSignUpForm ... /> with Dave Ramsey link
const formTagRegex = /<FpuSignUpForm[^>]+>/g;
const replacementLink = `<a
                href="https://www.financialpeace.com/app/classes/299D07"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-bold text-lg transition-all bg-[#d4a017] text-[#1a2e1e] shadow-[0_4px_20px_rgba(212,160,23,0.35)] hover:-translate-y-1 hover:shadow-[0_8px_28px_rgba(212,160,23,0.45)]"
              >
                Sign Up for Class →
              </a>`;
content = content.replace(formTagRegex, replacementLink);

// 3. Remove "It's free to join!"
content = content.replace("Once you have your kit, sign up for my class using the link below. It's free to join!", "Once you have your kit, sign up for my class using the link below.");

// 4. Remove useState if unused (optional, tsc handles it fine, but let's do it if easy)
content = content.replace('import { useState, useEffect } from "react";', 'import { useEffect } from "react";');

fs.writeFileSync(path, content, 'utf8');
