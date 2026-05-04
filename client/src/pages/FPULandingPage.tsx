import { useEffect } from "react";
import { Link } from "wouter";
import { BRAND } from "../../../shared/brand";

const PHOTO_LEEANNE_CHAIR =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663371864914/AofowMqj2LY3ZXRJFmskfG/4Z7A6694_5487dc73.jpg";
const LEEANNE_PHOTO =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663371864914/AofowMqj2LY3ZXRJFmskfG/3542web-rigeljackson(2)_83b0d4af.webp";

export default function FPULandingPage() {
  useEffect(() => {
    document.title = "Financial Peace Class - May 12 | Mind and Body Reset";
  }, []);

  return (
    <div className="min-h-screen bg-[#fffef9] text-[#2c3e28] font-sans">
      {/* SIMPLE LOGO HEADER - NO NAVIGATION */}
      <header className="py-6 px-6 border-b border-gray-100 flex justify-center">
        <Link href="/" className="flex items-center gap-3">
          <img src={BRAND.logoUrl} alt="Mind & Body Reset" className="w-10 h-10 rounded-full object-cover" />
          <span className="font-serif text-2xl text-[#1a2e1e] font-bold cursor-pointer">
            Mind & Body Reset
          </span>
        </Link>
      </header>

      {/* HERO SECTION */}
      <section className="bg-gradient-to-br from-[#1a2e1e] to-[#2d6a4f] text-white pt-16 pb-20 text-center px-4">
        <div className="container max-w-3xl mx-auto">
          <div className="inline-block bg-[#d4a017] text-[#1a2e1e] text-sm font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
            Dave Ramsey's Financial Peace University
          </div>
          <h1 className="font-serif text-4xl md:text-5xl leading-tight mb-6">
            Stop Dreading Your Bank Account & <br className="hidden md:block"/>
            <em className="text-[#52b788] not-italic italic">Take Back Control</em>
          </h1>
          <p className="text-lg md:text-xl opacity-90 mb-10">
            A 9-week program that takes you from financial overwhelm to financial peace — with real talk, real strategies, and zero shame.
          </p>
          
          <a href="#pricing" className="inline-block bg-[#d4a017] text-[#1a2e1e] font-bold text-xl px-12 py-5 rounded-full shadow-[0_4px_20px_rgba(212,160,23,0.35)] hover:-translate-y-1 hover:shadow-[0_8px_28px_rgba(212,160,23,0.45)] transition-all">
            Join the May 12 Class
          </a>
          <p className="text-sm opacity-60 mt-4">Spots are limited</p>
        </div>
      </section>

      {/* HIGH IMPACT BULLETS */}
      <section className="bg-white py-16 px-4">
        <div className="container max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-serif text-3xl text-[#1a2e1e] mb-2">What You'll Walk Away With</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { icon: "💸", title: "Your Debt Snowball, Started", desc: "Step-by-step guidance on how to begin — no guessing, just a clear path forward." },
              { icon: "📊", title: "A Budget You'll Actually Use", desc: "An in-depth plan built around your real life — not some spreadsheet that makes you want to cry." },
              { icon: "🧠", title: "Mindset Shifts", desc: "Because the numbers are only half the battle. We tackle the thinking that keeps people stuck." },
              { icon: "🎉", title: "Fun on Zero Budget", desc: "How to create memories with your kids that they'll still be laughing about years later." }
            ].map((feature, i) => (
              <div key={i} className="bg-[#fdf8f0] rounded-xl p-5 border-l-4 border-[#52b788] flex gap-4 items-start">
                <div className="text-3xl">{feature.icon}</div>
                <div>
                  <h3 className="font-bold text-[#1a2e1e] mb-1">{feature.title}</h3>
                  <p className="text-[#5a7a5e] text-sm leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BRIEF COACH BIO */}
      <section className="bg-[#fdf8f0] py-16 px-4">
        <div className="container max-w-3xl mx-auto flex flex-col md:flex-row gap-8 items-center">
          <div className="w-32 h-32 md:w-48 md:h-48 shrink-0 rounded-full border-4 border-white shadow-lg overflow-hidden">
            <img src={LEEANNE_PHOTO} alt="Lee Anne" className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="font-serif text-2xl text-[#1a2e1e] mb-3">Hi, I'm Lee Anne 👋</h2>
            <p className="mb-3 text-[1.05rem]">I'm a certified mindset life coach, health coach, and Financial Peace coach.</p>
            <p className="text-[1.05rem]">I know what crippling credit card debt feels like. I lived it. But I also know the exact step-by-step process to get out. It is <em>possible</em> for your family — and I'm going to walk alongside you every step of the way.</p>
          </div>
        </div>
      </section>

      {/* PRICING / CTA */}
      <section id="pricing" className="bg-[#1a2e1e] text-white py-20 px-4 text-center">
        <div className="container max-w-3xl mx-auto">
          <h2 className="font-serif text-3xl md:text-4xl text-[#52b788] mb-3">Ready to Change Everything?</h2>
          <p className="opacity-80 mb-10 text-lg">Claim your spot before the class fills up.</p>
          
          <div className="bg-white/5 border-2 border-[#d4a017] rounded-3xl p-8 max-w-md mx-auto backdrop-blur-sm">
            <div className="text-sm tracking-widest uppercase opacity-80 mb-4">9-Week Program</div>
            <div className="font-serif text-5xl text-[#d4a017] mb-2">~$130</div>
            <div className="italic opacity-70 mb-8 text-sm">Approximate cost for your FPU materials.</div>
            
            <div className="text-left mb-8 space-y-3">
              {[
                "9 weeks of Dave Ramsey's FPU curriculum",
                "Weekly group coaching with Lee Anne",
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
              🗓️ Next class begins <strong>May 12</strong>
            </div>
            
            <a 
              href="https://www.financialpeace.com/app/classes/299D07" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block w-full bg-[#d4a017] text-[#1a2e1e] font-bold py-4 rounded-full shadow-[0_4px_20px_rgba(212,160,23,0.35)] hover:-translate-y-1 hover:shadow-[0_8px_28px_rgba(212,160,23,0.45)] transition-all text-center text-lg"
            >
              Sign Up For the May 12 Class →
            </a>
            <p className="text-xs opacity-50 mt-4 text-center">You will be redirected to Dave Ramsey's official secure registration portal.</p>
          </div>
        </div>
      </section>
      
      <footer className="bg-[#111] text-white/40 py-8 text-center text-xs">
        <div className="container mx-auto px-4">
          <p>© {new Date().getFullYear()} Mind and Body Reset. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}
