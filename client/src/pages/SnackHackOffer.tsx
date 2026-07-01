import { Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { BRAND } from "../../../shared/brand";
import SiteFooter from "@/components/SiteFooter";
import SiteNav from "@/components/SiteNav";

export default function SnackHackOffer() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7]">
      <Helmet>
        <title>Your Guide is on the way! | {BRAND.name}</title>
      </Helmet>

      <SiteNav />

      <main className="flex-1 flex flex-col items-center py-16 px-4 sm:px-6 md:px-12 relative overflow-hidden">
        {/* Background Accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#c9a96e]/10 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#3a5a3a]/5 rounded-full blur-3xl -z-10 -translate-x-1/2 translate-y-1/2"></div>

        <div className="max-w-3xl mx-auto w-full text-center">
          <div className="inline-block px-4 py-1.5 rounded-full bg-[#f4f8f4] border border-[#c8dcc8] text-[#3a5a3a] text-sm font-semibold tracking-wide uppercase mb-6 shadow-sm">
            Step 1 Complete
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-playfair font-bold text-[#3a5a3a] mb-6 leading-tight">
            Your free guide is on its way to your inbox!
          </h1>
          
          <p className="text-xl text-gray-700 mb-10 leading-relaxed font-semibold">
            But before you go to check your email, please read this important message...
          </p>

          <div className="bg-white p-8 sm:p-12 rounded-2xl shadow-xl border border-gray-100 relative text-left">
            <h2 className="text-2xl font-playfair font-bold text-[#3a5a3a] mb-6">
              A PDF can only get you so far.
            </h2>
            
            <p className="text-gray-700 mb-5 leading-relaxed text-lg">
              The <strong>Midlife Mindset Guide</strong> is going to give you incredible strategies to stop evening food noise. But knowing <em>what</em> to do and actually doing it at 9:00 PM are two very different things.
            </p>
            
            <p className="text-gray-700 mb-5 leading-relaxed text-lg">
              If you've been struggling with late-night snacking, emotional eating, or hormonal shifts for years... you don't just need another PDF. <strong>You need someone in your corner.</strong>
            </p>

            <div className="bg-[#f9f5f0] border-l-4 border-[#c9a96e] p-6 my-8 rounded-r-lg">
              <h3 className="text-xl font-bold text-[#5a3e28] mb-3">
                1. Let's talk about it. No pressure, no sales tactics.
              </h3>
              <p className="text-gray-700 mb-0 leading-relaxed">
                I am offering a free, 30-minute Discovery Call to help you map out a personalized plan for your body and your habits. If you're tired of doing it alone, let's get on a call.
              </p>
            </div>

            <div className="bg-[#f4f8f4] border-l-4 border-[#3a5a3a] p-6 my-8 rounded-r-lg">
              <h3 className="text-xl font-bold text-[#2c452c] mb-3">
                2. Start building momentum today.
              </h3>
              <p className="text-gray-700 mb-0 leading-relaxed">
                While you wait for your call, I want you to start using my free <strong>Habit Tracker</strong>. It takes 30 seconds a day and helps you build the accountability you need to succeed.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-10">
              <Link href="/book">
                <a className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold bg-[#3a5a3a] hover:bg-[#2c452c] text-white rounded-full transition-colors shadow-md text-center w-full sm:w-auto">
                  Book Your Free Call
                </a>
              </Link>
              <Link href="/habit-tracker">
                <a className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold bg-white border-2 border-[#3a5a3a] text-[#3a5a3a] hover:bg-gray-50 rounded-full transition-colors text-center w-full sm:w-auto">
                  Open The Habit Tracker
                </a>
              </Link>
            </div>
            
            <p className="text-center text-sm text-gray-400 mt-8">
              Spots for discovery calls are limited each week.
            </p>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
