export const RECLAIM_EMAILS = [
  (name: string) => ({
    subject: "Welcome to R.E.C.L.A.I.M.! Here is your Week 1 Prep Work",
    html: `
      <div style="font-family:'Nunito Sans',Arial,sans-serif;max-width:600px;margin:0 auto;">
        <h1 style="color:#3a5a3a;">Welcome to R.E.C.L.A.I.M., ${name}!</h1>
        <p>I am so excited to begin this 6-week journey with you to reset your mind and body.</p>
        <p>Your portal is now unlocked! Please log in to your Reclaim Hub to access your Week 1 Module and complete your first assignment before our coaching session.</p>
        <a href="https://mindandbodyresetcoach.com/reclaim/hub" style="display:inline-block;background:#c9a96e;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;margin-top:10px;">Go To My Hub</a>
      </div>
    `,
  }),
  (name: string) => ({
    subject: "R.E.C.L.A.I.M. Week 2: Food Noise & Mindset Mapping",
    html: `
      <div style="font-family:'Nunito Sans',Arial,sans-serif;max-width:600px;margin:0 auto;">
        <h1 style="color:#3a5a3a;">Week 2 is unlocked, ${name}!</h1>
        <p>Great work on your first week! The next module, "Food Noise & Mindset Mapping", is now available in your Hub.</p>
        <a href="https://mindandbodyresetcoach.com/reclaim/hub" style="display:inline-block;background:#c9a96e;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;margin-top:10px;">View Week 2</a>
      </div>
    `,
  }),
  (name: string) => ({
    subject: "R.E.C.L.A.I.M. Week 3: Hormones, Hunger & Habits",
    html: `
      <div style="font-family:'Nunito Sans',Arial,sans-serif;max-width:600px;margin:0 auto;">
        <h1 style="color:#3a5a3a;">Week 3 is unlocked, ${name}!</h1>
        <p>Let's dive into the biology of cravings. Your Week 3 module and assignment are ready.</p>
        <a href="https://mindandbodyresetcoach.com/reclaim/hub" style="display:inline-block;background:#c9a96e;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;margin-top:10px;">View Week 3</a>
      </div>
    `,
  }),
  (name: string) => ({
    subject: "R.E.C.L.A.I.M. Week 4: Movement & Energy Reset",
    html: `
      <div style="font-family:'Nunito Sans',Arial,sans-serif;max-width:600px;margin:0 auto;">
        <h1 style="color:#3a5a3a;">Week 4 is unlocked, ${name}!</h1>
        <p>This week we focus on bringing energy back into the body. Log in to access your new module.</p>
        <a href="https://mindandbodyresetcoach.com/reclaim/hub" style="display:inline-block;background:#c9a96e;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;margin-top:10px;">View Week 4</a>
      </div>
    `,
  }),
  (name: string) => ({
    subject: "R.E.C.L.A.I.M. Week 5: Emotional Eating & Identity",
    html: `
      <div style="font-family:'Nunito Sans',Arial,sans-serif;max-width:600px;margin:0 auto;">
        <h1 style="color:#3a5a3a;">Week 5 is unlocked, ${name}!</h1>
        <p>We are doing the deep work now. Your Week 5 module and interactive journal are waiting for you.</p>
        <a href="https://mindandbodyresetcoach.com/reclaim/hub" style="display:inline-block;background:#c9a96e;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;margin-top:10px;">View Week 5</a>
      </div>
    `,
  }),
  (name: string) => ({
    subject: "R.E.C.L.A.I.M. Week 6: Integration & Your Life Forward",
    html: `
      <div style="font-family:'Nunito Sans',Arial,sans-serif;max-width:600px;margin:0 auto;">
        <h1 style="color:#3a5a3a;">Week 6 is unlocked, ${name}!</h1>
        <p>You made it to the final integration week! Please complete your final module and reflection before our last coaching session.</p>
        <a href="https://mindandbodyresetcoach.com/reclaim/hub" style="display:inline-block;background:#c9a96e;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;margin-top:10px;">View Week 6</a>
      </div>
    `,
  }),
];
