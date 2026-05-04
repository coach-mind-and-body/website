import { useEffect } from "react";
import SiteNav from "../components/SiteNav";
import SiteFooter from "../components/SiteFooter";

const PHOTO_LEEANNE_CHAIR =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663371864914/AofowMqj2LY3ZXRJFmskfG/4Z7A6694_5487dc73.jpg";
const PHOTO_LEEANNE_VEGGIES =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663371864914/AofowMqj2LY3ZXRJFmskfG/fpu-can-you-relate-LRquhXRPb6JDxJMEKYRtRh.webp";
const LEEANNE_PHOTO =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663371864914/AofowMqj2LY3ZXRJFmskfG/3542web-rigeljackson(2)_83b0d4af.webp";

export default function FinancialPeace() {
  useEffect(() => {
    document.title = "Financial Peace University | Mind and Body Reset";
    
    // Intersection Observer for fade-up animations
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
    
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-[#fffef9] text-[#2c3e28] font-sans">
      <SiteNav />

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1a2e1e] to-[#2d6a4f] text-white pt-32 pb-24 text-center px-6">
        <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-[#d4a017]/10" />
        <div className="absolute -bottom-20 -left-10 w-64 h-64 rounded-full bg-[#52b788]/10" />
        
        <div className="container relative z-10 max-w-4xl mx-auto">
          <div className="inline-block bg-[#d4a017] text-[#1a2e1e] text-sm font-bold uppercase tracking-widest px-5 py-1.5 rounded-full mb-6">
            Dave Ramsey's Financial Peace University
          </div>
          <h1 className="font-serif text-4xl md:text-6xl leading-tight mb-6 max-w-3xl mx-auto">
            What If You Could Stop Dreading Your Bank Account and <em className="text-[#52b788] not-italic italic">Actually Look Forward</em> to Your Future?
          </h1>
          <p className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto mb-10">
            A 9-week program that takes you from financial overwhelm to financial peace — with real talk, real strategies, and zero shame.
          </p>
          
          <a href="https://www.financialpeace.com/app/classes/299D07" target="_blank" rel="noopener noreferrer" className="inline-block bg-[#d4a017] text-[#1a2e1e] font-bold text-lg px-10 py-4 rounded-full shadow-[0_4px_20px_rgba(212,160,23,0.35)] hover:-translate-y-1 hover:shadow-[0_8px_28px_rgba(212,160,23,0.45)] transition-all">
            Yes, I'm Ready — Show Me How
          </a>
          <p className="text-sm opacity-60 mt-4">Next class begins May 12 · Limited spots available</p>
        </div>
      </section>

      {/* CAN YOU RELATE */}
      <section className="bg-[#fdf8f0] py-20 px-6">
        <div className="container max-w-5xl mx-auto flex flex-col md:flex-row gap-12 items-center fade-up">
          <div className="flex-1">
            <h2 className="font-serif text-3xl md:text-4xl text-[#1a2e1e] mb-3">Can You Relate?</h2>
            <p className="text-[#5a7a5e] mb-8">Be honest. Nobody's watching. 👀</p>
            
            <ul className="flex flex-col gap-4">
              {[
                { emoji: "😔", text: "You feel like you'll never get out of debt in this lifetime" },
                { emoji: "🤫", text: "You're secretly googling food banks near you and hoping your kids won't see your search history" },
                { emoji: "👟", text: "You're tired of telling your kids no when they ask for new shoes or a new toy" },
                { emoji: "🍽️", text: "You dread it when a friend asks you to dinner because you can't afford it — so you make up excuses" },
                { emoji: "⛺", text: "You're embarrassed when people ask where you're vacationing, because you're camping in the Walmart parking lot and hoping the kids think it's fun." }
              ].map((item, idx) => (
                <li key={idx} className="bg-white border-l-4 border-[#52b788] px-5 py-4 rounded-r-lg shadow-sm flex items-start">
                  <span className="mr-3 text-xl">{item.emoji}</span>
                  <span className="text-[1.05rem] leading-snug">{item.text}</span>
                </li>
              ))}
            </ul>
            
            <div className="mt-10 bg-[#fdf8f0] border-2 border-[#52b788] rounded-xl p-6 italic text-[#2d6a4f] text-lg font-serif">
              "If you said yes to any of these — I get it. I was there too."
            </div>
          </div>
          
          <div className="flex-1 w-full relative">
            <div className="absolute inset-0 bg-[#d4a017] translate-x-4 translate-y-4 rounded-2xl" />
            <img src={PHOTO_LEEANNE_VEGGIES} alt="Stressed with groceries" className="w-full h-auto rounded-2xl relative z-10 object-cover shadow-xl" />
          </div>
        </div>
      </section>

      {/* MY STORY */}
      <section className="bg-white py-20 px-6">
        <div className="container max-w-5xl mx-auto flex flex-col md:flex-row-reverse gap-12 items-center fade-up">
          <div className="flex-1">
            <h2 className="font-serif text-3xl md:text-4xl text-[#1a2e1e] mb-6">I Know This Feeling Because I Lived It</h2>
            <p className="mb-6 text-[1.05rem]">I'm not going to pretend I've always had it together. Here's what my reality actually looked like:</p>
            
            <ul className="flex flex-col gap-4 mb-8">
              {[
                "Crippling credit card debt that haunted me 24/7 and made every purchase feel heavy",
                "The humiliation of my neighbor telling me where to get a free box of food",
                "The tension with my husband when he mentioned going out to lunch",
                "Knowing our car needed a tune-up but also knowing it wasn't happening with our current debt"
              ].map((text, idx) => (
                <li key={idx} className="relative pl-8 text-[1.05rem]">
                  <span className="absolute left-0 text-[#2d6a4f] font-bold">→</span>
                  {text}
                </li>
              ))}
            </ul>
            
            <p className="text-[1.05rem]">And now? I'm a certified mindset life coach, health coach, and Financial Peace coach — and I get to help other families do what I did. Not because I had a perfect income, a perfect start, or a perfect marriage. But because I followed a process that works.</p>
          </div>
          
          <div className="flex-1 w-full relative">
            <div className="absolute inset-0 bg-[#52b788] -translate-x-4 translate-y-4 rounded-2xl" />
            <img src={PHOTO_LEEANNE_CHAIR} alt="Lee Anne coaching" className="w-full h-auto rounded-2xl relative z-10 object-cover shadow-xl" />
          </div>
        </div>
      </section>

      {/* WHAT YOU GET */}
      <section className="bg-[#fdf8f0] py-20 px-6">
        <div className="container max-w-5xl mx-auto fade-up">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl text-[#1a2e1e] mb-3">What You'll Walk Away With After 9 Weeks</h2>
            <p className="text-[#5a7a5e] text-lg">Real skills. Real shifts. A real plan that works for real families.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: "💸", title: "Your Debt Snowball, Started", desc: "Step-by-step guidance on how to begin — no guessing, no confusion, just a clear path forward." },
              { icon: "📊", title: "A Budget You'll Actually Use", desc: "An in-depth plan built around your real life — not some spreadsheet that makes you want to cry." },
              { icon: "🛡️", title: "Insurance You Need vs. Don't", desc: "Finally understand what you're actually paying for — and what you can cut without risk." },
              { icon: "🧠", title: "Mindset Shifts", desc: "Because the numbers are only half the battle. We tackle the thinking that keeps people stuck." },
              { icon: "🍽️", title: "Eating Well on a Budget", desc: "How to eat food that's actually enjoyable — not just 'rice and beans' every night." },
              { icon: "🎉", title: "Fun on Zero Budget", desc: "How to create memories with your kids that they'll still be laughing about years later." }
            ].map((feature, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm border-t-[3px] border-[#52b788] transition-transform hover:-translate-y-1">
                <div className="text-3xl mb-3">{feature.icon}</div>
                <h3 className="font-bold text-[#1a2e1e] mb-2">{feature.title}</h3>
                <p className="text-[#5a7a5e] text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MEET LEE ANNE */}
      <section className="bg-white py-20 px-6">
        <div className="container max-w-4xl mx-auto flex flex-col md:flex-row gap-10 items-center fade-up">
          <div className="w-48 h-48 md:w-56 md:h-56 shrink-0 rounded-full border-8 border-[#fdf8f0] shadow-xl overflow-hidden">
            <img src={LEEANNE_PHOTO} alt="Lee Anne" className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="font-serif text-3xl md:text-4xl text-[#1a2e1e] mb-4">Hi, I'm Lee Anne 👋</h2>
            <p className="mb-4 text-[1.05rem]">I'm a certified mindset life coach, health coach, and Financial Peace coach — and someone who has lived every one of those bullet points above in real time.</p>
            <p className="mb-4 text-[1.05rem]">I'm not going to lie to you: <strong className="text-[#2d6a4f]">it takes work, consistency, and trusting the process.</strong> But I'm going to walk alongside you every step of the way. We'll tackle the mindset roadblocks, the family resistance, and the daily strategies you need to actually stay the course.</p>
            <p className="text-[1.05rem]">It is <em>possible</em> for you and your family — no matter how much debt you have right now. Your journey starts now.</p>
          </div>
        </div>
      </section>

      {/* PRICING / SIGN UP */}
      <section id="pricing" className="bg-[#1a2e1e] text-white py-24 px-6 text-center">
        <div className="container max-w-3xl mx-auto fade-up">
          <h2 className="font-serif text-3xl md:text-4xl text-[#52b788] mb-3">Ready to Change Everything?</h2>
          <p className="opacity-80 mb-10 text-lg">Here's what's included — and what it costs.</p>
          
          <div className="bg-white/5 border-2 border-[#d4a017] rounded-3xl p-8 md:p-12 max-w-md mx-auto relative backdrop-blur-sm">
            <div className="text-sm tracking-widest uppercase opacity-80 mb-4">Financial Peace University — 9 Weeks</div>
            <div className="font-serif text-5xl text-[#d4a017] mb-2">Free</div>
            <div className="italic opacity-70 mb-8 text-sm">Join our upcoming group absolutely free!</div>
            
            <div className="text-left mb-8 space-y-3">
              {[
                "9 weeks of Dave Ramsey's FPU curriculum",
                "Weekly group coaching with Lee Anne",
                "Mindset + accountability support",
                "Budget templates and tools",
                "Access to our private community"
              ].map((item, i) => (
                <div key={i} className="flex items-start border-b border-white/10 pb-3 last:border-0">
                  <span className="text-[#52b788] font-bold mr-3">✓</span>
                  <span className="text-sm opacity-90">{item}</span>
                </div>
              ))}
            </div>
            
            <div className="bg-[#d4a017]/10 border border-[#d4a017]/30 rounded-xl p-4 mb-8 text-sm opacity-90">
              🗓️ Next class begins <strong>May 12</strong> · Limited spots available
            </div>
            
            <a 
              href="https://www.financialpeace.com/app/classes/299D07" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block w-full bg-[#d4a017] text-[#1a2e1e] font-bold py-4 rounded-full shadow-[0_4px_20px_rgba(212,160,23,0.35)] hover:-translate-y-1 hover:shadow-[0_8px_28px_rgba(212,160,23,0.45)] transition-all text-center text-lg"
            >
              Sign Up for the May 12 Class →
            </a>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
