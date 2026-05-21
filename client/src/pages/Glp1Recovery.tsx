import { Helmet } from "react-helmet-async";
import { Link } from "wouter";
import { ArrowRight, Leaf, ShieldCheck, Activity, CheckCircle2 } from "lucide-react";
import SiteNav from "../components/SiteNav";
import SiteFooter from "../components/SiteFooter";
import { Button } from "@/components/ui/button";

export default function Glp1Recovery() {
  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Life After GLP-1: How to Prevent Rebound Weight Gain Naturally | Mind & Body Reset</title>
        <meta
          name="description"
          content="Struggling with life after the shot? Learn how to naturally maintain your weight loss, manage insulin resistance, and support natural GLP-1 production without injections."
        />
        {/* SEO Canonical and Schema */}
        <link rel="canonical" href="https://mindandbodyresetcoach.com/life-after-glp-1" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": "Life After GLP-1: Preventing Rebound Weight Gain Naturally",
            "description": "A holistic guide to maintaining weight loss after stopping GLP-1 injections using natural systems and metabolic health protocols.",
            "author": {
              "@type": "Organization",
              "name": "Mind & Body Reset Coach"
            }
          })}
        </script>
      </Helmet>

      <SiteNav />

      <main>
        {/* Hero Section */}
        <section className="relative pt-24 pb-20 md:pt-32 md:pb-28 overflow-hidden bg-[oklch(0.97_0.01_160)]">
          <div className="container relative z-10 px-4 md:px-6">
            <div className="max-w-3xl mx-auto text-center space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/60 border border-[oklch(0.90_0.01_160)] text-sm font-medium text-[oklch(0.40_0.02_160)] mb-4">
                <Leaf className="w-4 h-4" /> Holistic Metabolic Health
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[oklch(0.22_0.02_160)] leading-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                Life After the Shot: Maintaining Your Weight Loss Naturally
              </h1>
              <p className="text-lg md:text-xl text-[oklch(0.45_0.02_160)] leading-relaxed">
                GLP-1 medications are powerful, but they aren't a permanent fix. Discover the holistic protocol to prevent rebound weight gain, heal your metabolism, and naturally stimulate GLP-1 production.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Link href="/feel-great-system">
                  <Button size="lg" className="w-full sm:w-auto bg-[oklch(0.45_0.08_160)] hover:bg-[oklch(0.40_0.08_160)] text-white h-12 px-8 text-base shadow-lg rounded-full">
                    Discover the Natural Solution <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/book">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 px-8 text-base border-[oklch(0.45_0.08_160)] text-[oklch(0.45_0.08_160)] rounded-full hover:bg-[oklch(0.97_0.01_160)]">
                    Book a Free Consultation
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* The Problem Section */}
        <section className="py-20 bg-white">
          <div className="container px-4 md:px-6">
            <div className="grid md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-[oklch(0.22_0.02_160)] mb-6" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                  The Rebound Reality: Why Weight Comes Back
                </h2>
                <div className="space-y-4 text-[oklch(0.45_0.02_160)] leading-relaxed">
                  <p>
                    Semaglutide and other GLP-1 receptor agonists are highly effective at suppressing appetite and slowing gastric emptying. However, studies show that a significant majority of patients regain up to two-thirds of the weight they lost within a year of stopping the medication.
                  </p>
                  <p>
                    <strong>Why does this happen?</strong> Because the injections artificially simulate a hormone. When you stop, the underlying metabolic dysfunction—such as insulin resistance and hormonal imbalances—often remains entirely unaddressed.
                  </p>
                </div>
                <div className="mt-8 space-y-3">
                  {[
                    "Unresolved Insulin Resistance",
                    "Suppressed natural metabolic function",
                    "Return of severe food noise and cravings",
                    "Loss of lean muscle mass during the injection phase"
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-[oklch(0.95_0.02_15)] flex items-center justify-center">
                        <XIcon className="w-3 h-3 text-[oklch(0.55_0.15_15)]" />
                      </div>
                      <span className="text-[oklch(0.35_0.02_160)] font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-[oklch(0.95_0.02_160)] to-[oklch(0.90_0.05_160)] rounded-2xl transform rotate-3"></div>
                <img 
                  src="https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070&auto=format&fit=crop" 
                  alt="Woman looking stressed about health"
                  className="relative z-10 rounded-2xl shadow-xl w-full object-cover h-[400px]"
                />
              </div>
            </div>
          </div>
        </section>

        {/* The Solution / Bridge Section */}
        <section className="py-20 bg-[oklch(0.98_0.005_160)] border-y border-[oklch(0.90_0.01_160)]">
          <div className="container px-4 md:px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-[oklch(0.22_0.02_160)] mb-4" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                The Holistic Bridge: How to Transition Successfully
              </h2>
              <p className="text-[oklch(0.45_0.02_160)] text-lg">
                You don't have to choose between a lifetime of injections or gaining the weight back. By implementing specific protocols, you can teach your body to produce its own GLP-1 natively.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[
                {
                  icon: Activity,
                  title: "Heal Insulin Resistance",
                  desc: "Address the root cause by stabilizing blood glucose and insulin levels through targeted nutrition and supplementation.",
                  link: "/food-quiz",
                  linkText: "Take the Free Insulin Quiz"
                },
                {
                  icon: ShieldCheck,
                  title: "Natural GLP-1 Production",
                  desc: "Utilize clinically-proven systems like Unicity to naturally stimulate your body's innate GLP-1 production without synthetic drugs.",
                  link: "/feel-great-system",
                  linkText: "Explore the Feel Great System"
                },
                {
                  icon: Leaf,
                  title: "Reset the Nervous System",
                  desc: "Cortisol and stress directly impact weight. A holistic approach requires resetting your central nervous system to get out of fight-or-flight.",
                  link: "/reclaim",
                  linkText: "Learn about R.E.C.L.A.I.M."
                }
              ].map((card, idx) => (
                <div key={idx} className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow border border-[oklch(0.95_0.01_160)]">
                  <div className="w-12 h-12 rounded-xl bg-[oklch(0.95_0.02_160)] flex items-center justify-center mb-6">
                    <card.icon className="w-6 h-6 text-[oklch(0.45_0.08_160)]" />
                  </div>
                  <h3 className="text-xl font-bold text-[oklch(0.22_0.02_160)] mb-3">{card.title}</h3>
                  <p className="text-[oklch(0.45_0.02_160)] mb-6 leading-relaxed">
                    {card.desc}
                  </p>
                  <Link href={card.link} className="inline-flex items-center text-[oklch(0.45_0.08_160)] font-semibold hover:text-[oklch(0.35_0.08_160)] transition-colors">
                    {card.linkText} <ArrowRight className="ml-1 w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Deep Dive into Unicity / Feel Great */}
        <section className="py-24 bg-white">
          <div className="container px-4 md:px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
              <div className="order-2 lg:order-1 relative">
                <div className="absolute inset-0 bg-[oklch(0.95_0.02_160)] rounded-full blur-3xl opacity-50"></div>
                <img 
                  src="https://images.unsplash.com/photo-1542442828-287217bfb829?q=80&w=2070&auto=format&fit=crop" 
                  alt="Healthy lifestyle and supplements" 
                  className="relative z-10 rounded-2xl shadow-2xl object-cover w-full h-[500px]"
                />
              </div>
              <div className="order-1 lg:order-2">
                <div className="inline-flex items-center gap-2 text-[oklch(0.45_0.08_160)] font-semibold tracking-wide uppercase text-sm mb-4">
                  The Feel Great System
                </div>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[oklch(0.22_0.02_160)] mb-6 leading-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                  The All-Natural Alternative to Weight Loss Shots
                </h2>
                <div className="space-y-6 text-[oklch(0.45_0.02_160)] text-lg leading-relaxed">
                  <p>
                    If you are coming off an injection or looking for a natural alternative to start with, the <Link href="/feel-great-system" className="text-[oklch(0.45_0.08_160)] underline hover:text-[oklch(0.35_0.08_160)]">Feel Great System</Link> is designed to bridge the gap.
                  </p>
                  <p>
                    It utilizes highly-purified, specialized plant fibers that expand in the stomach (promoting satiety) and slow the absorption of glucose. This biological mechanism naturally prompts your own digestive tract to produce GLP-1, keeping you full and silencing food noise.
                  </p>
                  
                  <ul className="space-y-4 pt-2">
                    {[
                      "No needles, prescriptions, or synthetic side effects.",
                      "Significantly lowers blood sugar and insulin spikes.",
                      "Sustainable for long-term daily use.",
                      "Protects lean muscle mass while burning fat."
                    ].map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <CheckCircle2 className="w-6 h-6 text-[oklch(0.55_0.15_145)] shrink-0" />
                        <span className="font-medium text-[oklch(0.35_0.02_160)]">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="pt-6">
                    <Link href="/feel-great-system">
                      <Button className="bg-[oklch(0.45_0.08_160)] hover:bg-[oklch(0.40_0.08_160)] text-white h-14 px-8 text-lg rounded-full w-full sm:w-auto shadow-lg">
                        View the Feel Great Protocol
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-[oklch(0.22_0.02_160)] text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[oklch(0.45_0.08_160)] rounded-full blur-3xl"></div>
          </div>
          <div className="container relative z-10 px-4 text-center max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Ready to Break Free from the Injection Cycle?
            </h2>
            <p className="text-xl text-white/80 mb-10 leading-relaxed">
              Don't wait for the rebound weight gain to start. Book a free consultation today to build your holistic exit strategy and take control of your metabolic health permanently.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/book">
                <Button size="lg" className="h-14 px-10 text-lg bg-white text-[oklch(0.22_0.02_160)] hover:bg-[oklch(0.95_0.02_160)] rounded-full">
                  Book Your Strategy Call
                </Button>
              </Link>
              <Link href="/about">
                <Button variant="outline" size="lg" className="h-14 px-10 text-lg border-white text-[oklch(0.22_0.02_160)] hover:bg-white/10 rounded-full">
                  Learn About My Approach
                </Button>
              </Link>
            </div>
          </div>
        </section>

      </main>
      <SiteFooter />
    </div>
  );
}

function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
