"use client";


import Link from 'next/link';
;
import { ArrowRight, Brain, Heart, Activity, Apple, Zap, Scale } from "lucide-react";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";

export default function HolisticHealth() {
  return (
    <div className="min-h-screen bg-white">
      

      <SiteNav />

      <main>
        {/* Hero Section */}
        <section className="relative pt-24 pb-20 md:pt-32 md:pb-28 overflow-hidden bg-white border-b border-[oklch(0.95_0.01_160)]">
          <div className="absolute inset-0 pointer-events-none">
             <div className="absolute top-1/4 left-0 w-1/3 h-1/2 bg-[oklch(0.95_0.02_160)] rounded-r-full blur-3xl opacity-50"></div>
          </div>
          <div className="container relative z-10 px-4 md:px-6">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[oklch(0.97_0.01_160)] text-sm font-medium text-[oklch(0.40_0.02_160)]">
                  <Brain className="w-4 h-4" /> Root-Cause Healing
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[oklch(0.22_0.02_160)] leading-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                  What is True Holistic Health & Wellness?
                </h1>
                <p className="text-lg md:text-xl text-[oklch(0.45_0.02_160)] leading-relaxed">
                  Holistic wellness isn't just about eating greens and doing yoga. It is the science of understanding that your metabolic health, nervous system, and daily habits are entirely interconnected.
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                  <Link href="/reclaim">
                    <Button size="lg" className="w-full sm:w-auto bg-[oklch(0.22_0.02_160)] hover:bg-[oklch(0.35_0.02_160)] text-white h-12 px-8 text-base shadow-lg rounded-full">
                      Start Your R.E.C.L.A.I.M. Journey
                    </Button>
                  </Link>
                  <Link href="/book">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 px-8 text-base border-[oklch(0.22_0.02_160)] text-[oklch(0.22_0.02_160)] rounded-full hover:bg-[oklch(0.97_0.01_160)]">
                      Book a Free Call
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=2120&auto=format&fit=crop" 
                  alt="Woman practicing mindful yoga and wellness"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* The Core Pillars */}
        <section className="py-20 bg-[oklch(0.98_0.005_160)]">
          <div className="container px-4 md:px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-[oklch(0.22_0.02_160)] mb-4" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                The Three Pillars of Mind & Body Reset
              </h2>
              <p className="text-[oklch(0.45_0.02_160)] text-lg">
                To achieve lasting change—whether that's sustainable weight loss, reversing burnout, or regaining your energy—we must address all three pillars simultaneously.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[
                {
                  icon: Brain,
                  title: "Nervous System Regulation",
                  desc: "Chronic stress keeps your body in a sympathetic 'fight or flight' state, increasing cortisol, hoarding belly fat, and causing burnout.",
                  link: "/reclaim",
                  linkText: "Discover the R.E.C.L.A.I.M. System"
                },
                {
                  icon: Activity,
                  title: "Metabolic Healing",
                  desc: "Insulin resistance is the root of modern disease. By optimizing your blood sugar naturally, you can silence food noise and restore energy.",
                  link: "/feel-great-system",
                  linkText: "Explore the Feel Great Protocol"
                },
                {
                  icon: Heart,
                  title: "Financial & Emotional Peace",
                  desc: "You cannot separate financial stress from physical health. True wellness requires peace in your mind, your body, and your bank account.",
                  link: "/financial-peace-university",
                  linkText: "Join Financial Peace University"
                }
              ].map((card, idx) => (
                <div key={idx} className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-all border border-[oklch(0.95_0.01_160)] group">
                  <div className="w-14 h-14 rounded-xl bg-[oklch(0.97_0.01_160)] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <card.icon className="w-7 h-7 text-[oklch(0.45_0.08_160)]" />
                  </div>
                  <h3 className="text-xl font-bold text-[oklch(0.22_0.02_160)] mb-3">{card.title}</h3>
                  <p className="text-[oklch(0.45_0.02_160)] mb-6 leading-relaxed">
                    {card.desc}
                  </p>
                  <Link href={card.link} className="inline-flex items-center text-[oklch(0.40_0.08_160)] font-semibold hover:text-[oklch(0.30_0.08_160)] transition-colors">
                    {card.linkText} <ArrowRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Diets Fail (Linking to Food Quiz & Feel Great) */}
        <section className="py-24 bg-white border-y border-[oklch(0.95_0.01_160)]">
          <div className="container px-4 md:px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
              <div className="space-y-6">
                <h2 className="text-3xl md:text-4xl font-bold text-[oklch(0.22_0.02_160)] leading-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                  Why Calorie Counting and Fad Diets Always Fail You
                </h2>
                <div className="space-y-4 text-[oklch(0.45_0.02_160)] text-lg leading-relaxed">
                  <p>
                    For decades, the fitness industry has preached "eat less, move more." But if it were that simple, we wouldn't be in the middle of a metabolic crisis.
                  </p>
                  <p>
                    When your body is heavily insulin resistant, you biologically cannot access your fat stores for energy. Your cells are starving, which is why you experience intense cravings and a sluggish metabolism, no matter how hard you restrict your eating.
                  </p>
                  <p className="font-medium text-[oklch(0.22_0.02_160)]">
                    It's not a lack of willpower. It's a hormonal imbalance.
                  </p>
                </div>
                <div className="pt-4 grid sm:grid-cols-2 gap-4">
                  <Link href="/food-quiz" className="block p-4 rounded-xl border border-[oklch(0.90_0.01_160)] hover:border-[oklch(0.45_0.08_160)] bg-[oklch(0.98_0.005_160)] hover:bg-white transition-all">
                    <Apple className="w-6 h-6 text-[oklch(0.45_0.08_160)] mb-3" />
                    <h4 className="font-bold text-[oklch(0.22_0.02_160)] mb-1">Take the Free Quiz</h4>
                    <p className="text-sm text-[oklch(0.45_0.02_160)]">Find out if insulin resistance is holding you back.</p>
                  </Link>
                  <Link href="/feel-great-system" className="block p-4 rounded-xl border border-[oklch(0.90_0.01_160)] hover:border-[oklch(0.45_0.08_160)] bg-[oklch(0.98_0.005_160)] hover:bg-white transition-all">
                    <Zap className="w-6 h-6 text-[oklch(0.45_0.08_160)] mb-3" />
                    <h4 className="font-bold text-[oklch(0.22_0.02_160)] mb-1">The Feel Great System</h4>
                    <p className="text-sm text-[oklch(0.45_0.02_160)]">Our clinically-proven protocol to heal your metabolism.</p>
                  </Link>
                </div>
              </div>
              <div className="relative">
                <div className="absolute -inset-4 bg-[oklch(0.97_0.01_160)] rounded-[2.5rem] transform -rotate-3 z-0"></div>
                <img 
                  src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=2070&auto=format&fit=crop" 
                  alt="Healthy fresh food bowls" 
                  className="relative z-10 rounded-2xl shadow-xl w-full object-cover h-[450px]"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Read more on the blog */}
        <section className="py-20 bg-[oklch(0.97_0.01_160)]">
           <div className="container px-4 md:px-6 text-center max-w-4xl mx-auto">
             <h2 className="text-3xl font-bold text-[oklch(0.22_0.02_160)] mb-6" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
               Continue Your Holistic Education
             </h2>
             <p className="text-[oklch(0.45_0.02_160)] text-lg mb-8">
               We publish new insights on metabolic health, emotional eating, and burnout recovery regularly. 
               Check out the Mind & Body Reset Blog for the latest science-backed strategies.
             </p>
             <Link href="/health-wellness-blog">
               <Button className="bg-[oklch(0.22_0.02_160)] hover:bg-[oklch(0.35_0.02_160)] text-white h-12 px-8 text-base rounded-full">
                 Read the Blog
               </Button>
             </Link>
           </div>
        </section>

      </main>
      <SiteFooter />
    </div>
  );
}
