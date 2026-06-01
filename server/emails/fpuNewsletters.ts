import { ENV } from "../_core/env";

const baseStyle = `font-family:'Nunito Sans',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);`;
const headerStyle = `background:linear-gradient(135deg,#5a7a5a 0%,#3a5a3a 100%);padding:40px;text-align:center;`;
const contentStyle = `padding:36px 40px;color:#4a4a4a;font-size:16px;line-height:1.6;`;
const h1Style = `margin:0 0 8px;color:white;font-size:26px;font-weight:700;`;
const subStyle = `margin:0;color:rgba(255,255,255,0.85);font-size:15px;`;
const h2Style = `color:#3a5a3a;font-size:20px;font-weight:700;margin-top:24px;margin-bottom:12px;border-bottom:2px solid #e8ddd0;padding-bottom:8px;`;
const boxStyle = `background:#f4f8f4;border:1px solid #c8dcc8;padding:20px;border-radius:8px;margin:24px 0;`;

export const getFpuEmail1 = (firstName: string) => ({
  subject: "Your First $1,000 Changes Everything",
  html: `
    <div style="${baseStyle}">
      <div style="${headerStyle}">
        <h1 style="${h1Style}">Baby Step 1</h1>
        <p style="${subStyle}">Start Your Emergency Fund</p>
      </div>
      <div style="${contentStyle}">
        <p>Hi ${firstName},</p>
        <p>Most people think financial peace starts when they make more money. It doesn’t.</p>
        <p>Financial peace starts the moment you stop living in panic mode.</p>
        <p>That’s why Baby Step 1 is so powerful: <strong>Save your first $1,000 emergency fund as FAST as possible.</strong></p>
        <p>This isn’t about being perfect. It’s about creating breathing room. A flat tire. A sick kid. A surprise bill. Without an emergency fund, life turns into debt. With an emergency fund, life becomes manageable.</p>
        
        <h2 style="${h2Style}">Quick Wins This Week:</h2>
        <ul>
          <li>Sell 5 things around your house</li>
          <li>Pause unnecessary subscriptions</li>
          <li>Skip takeout for one week</li>
          <li>Put every extra dollar toward your $1,000 goal</li>
          <li>Have a “no-spend weekend”</li>
        </ul>

        <div style="${boxStyle}">
          <strong>Simple Budget Tip:</strong> Give every dollar a job before the month begins. Even small amounts matter.
        </div>

        <h2 style="${h2Style}">Budget-Friendly Recipe: One-Pot Taco Rice Bowls</h2>
        <p><strong>Ingredients:</strong> 1 lb ground turkey or beef, 1 packet taco seasoning, 1 cup rice, 1 can black beans, 1 cup frozen corn. Salsa & cheese (optional).</p>
        <p><strong>Instructions:</strong> Brown meat and add seasoning. Cook rice separately. Mix everything together and top with salsa or cheese. <em>Feeds a family for under $12!</em></p>

        <p><strong>Encouragement:</strong> Small steps create big momentum. Your emergency fund is proof that YOU are taking control.</p>
        <p style="margin-top:24px;">With love,<br/><strong>Lee Anne</strong></p>
      </div>
    </div>
  `
});

export const getFpuEmail2 = (firstName: string) => ({
  subject: "Stop the Leaks in Your Budget",
  html: `
    <div style="${baseStyle}">
      <div style="${headerStyle}">
        <h1 style="${h1Style}">Tiny Expenses Add Up Fast</h1>
        <p style="${subStyle}">Baby Step 1</p>
      </div>
      <div style="${contentStyle}">
        <p>Hi ${firstName},</p>
        <p>You don’t need a perfect budget. You need awareness.</p>
        <p>Most people lose money in small daily leaks: drive-thru drinks, random Amazon purchases, convenience foods, and subscription creep.</p>
        <p>Baby Step 1 is about intensity. For a short season, we get focused so we can create long-term peace.</p>
        
        <h2 style="${h2Style}">Quick Wins This Week:</h2>
        <ul>
          <li>Unsubscribe from store emails</li>
          <li>Use grocery pickup to avoid impulse spending</li>
          <li>Meal plan before shopping</li>
          <li>Take inventory of your pantry first</li>
          <li>Challenge yourself to 3 “no-spend days”</li>
        </ul>

        <div style="${boxStyle}">
          <strong>Simple Budget Tip:</strong> Track every dollar for 7 days. Awareness alone changes behavior.
        </div>

        <h2 style="${h2Style}">Budget-Friendly Recipe: Sheet Pan Chicken & Veggies</h2>
        <p><strong>Ingredients:</strong> Chicken thighs, potatoes, carrots, broccoli, olive oil + seasoning.</p>
        <p><strong>Instructions:</strong> Chop vegetables. Toss with oil and seasoning. Bake at 400° for 35–40 minutes. <em>Easy cleanup. Budget friendly. Great leftovers.</em></p>

        <p><strong>Encouragement:</strong> You are not behind. You are building a new foundation.</p>
        <p style="margin-top:24px;">With love,<br/><strong>Lee Anne</strong></p>
      </div>
    </div>
  `
});

export const getFpuEmail3 = (firstName: string) => ({
  subject: "Progress Over Perfection",
  html: `
    <div style="${baseStyle}">
      <div style="${headerStyle}">
        <h1 style="${h1Style}">Don’t Quit Because It’s Hard</h1>
        <p style="${subStyle}">Baby Step 1</p>
      </div>
      <div style="${contentStyle}">
        <p>Hi ${firstName},</p>
        <p>One of the biggest mistakes people make with money is believing they failed because they had an unexpected expense. That’s actually WHY we save.</p>
        <p>Progress matters more than perfection. Maybe you only saved $50 this week, or $10 from saying no to impulse spending. That still counts.</p>
        <p>Momentum is built one decision at a time.</p>
        
        <h2 style="${h2Style}">Quick Wins This Week:</h2>
        <ul>
          <li>Put loose cash/change into savings</li>
          <li>Pick up one extra shift or side job</li>
          <li>Sell unused clothes or furniture</li>
          <li>Use cash envelopes for problem spending areas</li>
          <li>Cook at home 5 nights this week</li>
        </ul>

        <div style="${boxStyle}">
          <strong>Simple Budget Tip:</strong> When tempted to buy something, ask: “Would I rather have this item or financial peace?”
        </div>

        <h2 style="${h2Style}">Budget-Friendly Recipe: Slow Cooker Chili</h2>
        <p><strong>Ingredients:</strong> 1 lb ground beef/turkey, 2 cans beans, 1 can diced tomatoes, chili seasoning, onion.</p>
        <p><strong>Instructions:</strong> Brown meat. Add everything to slow cooker. Cook 4–6 hours. <em>Cheap, filling, and perfect for leftovers.</em></p>

        <p><strong>Encouragement:</strong> You don’t need to change everything overnight. You just need to keep going.</p>
        <p style="margin-top:24px;">With love,<br/><strong>Lee Anne</strong></p>
      </div>
    </div>
  `
});

export const getFpuEmail4 = (firstName: string) => ({
  subject: "You’re Building Confidence, Not Just Savings",
  html: `
    <div style="${baseStyle}">
      <div style="${headerStyle}">
        <h1 style="${h1Style}">Baby Step 1 Is Bigger Than Money</h1>
        <p style="${subStyle}">Baby Step 1</p>
      </div>
      <div style="${contentStyle}">
        <p>Hi ${firstName},</p>
        <p>Your first $1,000 emergency fund is about more than money. It changes how you feel.</p>
        <p>Instead of feeling stressed, ashamed, overwhelmed, or afraid, you begin to feel <strong>capable, prepared, hopeful, and empowered.</strong></p>
        <p>That’s the real win. Money stops controlling you. YOU start controlling your money.</p>
        
        <h2 style="${h2Style}">Quick Wins This Week:</h2>
        <ul>
          <li>Automate small transfers to savings</li>
          <li>Celebrate every milestone</li>
          <li>Review your budget weekly</li>
          <li>Keep your “why” visible</li>
          <li>Stay focused on progress, not comparison</li>
        </ul>

        <div style="${boxStyle}">
          <strong>Simple Budget Tip:</strong> Budget meetings don’t have to be complicated. A simple 15-minute check-in each week creates huge awareness.
        </div>

        <h2 style="${h2Style}">Budget-Friendly Recipe: Breakfast-for-Dinner Burritos</h2>
        <p><strong>Ingredients:</strong> Eggs, tortillas, potatoes, cheese, salsa.</p>
        <p><strong>Instructions:</strong> Cook potatoes and eggs. Add to tortilla. Top with cheese and salsa. Roll and serve. <em>Simple, filling, and inexpensive.</em></p>

        <p><strong>Encouragement:</strong> Financial peace doesn’t happen all at once. It happens one decision, one dollar, and one Baby Step at a time.</p>
        <p style="margin-top:24px;">With love,<br/><strong>Lee Anne</strong></p>
      </div>
    </div>
  `
});

export const FPU_EMAILS = [
  getFpuEmail1,
  getFpuEmail2,
  getFpuEmail3,
  getFpuEmail4
];
