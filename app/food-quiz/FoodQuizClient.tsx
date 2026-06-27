"use client";

import { useState } from "react";
import { CheckCircle2, ArrowRight, Sparkles } from "lucide-react";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { usePathname, useRouter } from 'next/navigation';
import { useMetaPixel } from "@/hooks/useMetaPixel";
import { getMetaParams, generateMetaEventId } from "@/hooks/useMetaParams";
import { trpc } from "@/lib/trpc";
import { useGoogleAnalytics } from "@/hooks/useGoogleAnalytics";


const ZAPIER_URL = "https://hooks.zapier.com/hooks/catch/22551341/uw0om13/";

const questions = [
  {
    question: "How do you usually feel after starting over with food?",
    answers: [
      { text: "Exhausted and frustrated", v: "A" },
      { text: "Good for a while, then I lose momentum", v: "B" },
      { text: "Confused by my body's signals", v: "C" },
      { text: "Motivated but nervous I'll slip back", v: "D" },
    ],
  },
  {
    question: "Which phrase sounds most like your relationship with food?",
    answers: [
      { text: "I think about food more than I want to.", v: "A" },
      { text: "I'm great during the week but crash on weekends.", v: "B" },
      { text: "I want to trust myself but I don't yet.", v: "C" },
      { text: "I'm craving peace, not another plan.", v: "D" },
    ],
  },
  {
    question: "What's your go-to move when you feel off track?",
    answers: [
      { text: "Start over Monday.", v: "A" },
      { text: "Cut carbs or sugar.", v: "B" },
      { text: "Try a new challenge.", v: "C" },
      { text: "Promise to do better next time.", v: "D" },
    ],
  },
  {
    question: "If your body could text you right now, what would it say?",
    answers: [
      { text: '"Can we be friends again?"', v: "A" },
      { text: '"Please stop skipping meals."', v: "B" },
      { text: '"I need consistency."', v: "C" },
      { text: '"Thank you for not giving up."', v: "D" },
    ],
  },
  {
    question: "How do you want to feel 2 months from now?",
    answers: [
      { text: "Calm and in control.", v: "A" },
      { text: "Confident in my body.", v: "B" },
      { text: "Free from guilt.", v: "C" },
      { text: "Trusting myself again.", v: "D" },
    ],
  },
];

type Screen = "start" | "quiz" | "email" | "submitting";

export default function FoodQuiz() {
  const submitFoodQuizLead = trpc.leadgen.submitFoodQuiz.useMutation();
  
  const { trackLead } = useMetaPixel();
  const ga = useGoogleAnalytics();
  const [screen, setScreen] = useState<Screen>("start");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const router = useRouter();

  const progress = screen === "start" ? 0 : screen === "email" || screen === "submitting" ? 100 : Math.round((currentIdx / questions.length) * 100);

  function handleStart() {
    setScreen("quiz");
    setCurrentIdx(0);
    setUserAnswers([]);
  }

  function handleAnswer(v: string) {
    if (selectedAnswer) return; // prevent double-click
    setSelectedAnswer(v);
    const newAnswers = [...userAnswers, v];
    setTimeout(() => {
      setSelectedAnswer(null);
      if (currentIdx + 1 < questions.length) {
        setCurrentIdx(currentIdx + 1);
        setUserAnswers(newAnswers);
      } else {
        setUserAnswers(newAnswers);
        setScreen("email");
      }
    }, 420);
  }

  async function handleSubmit() {
    if (!email.includes("@")) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    setEmailError("");
    setScreen("submitting");

    const counts = userAnswers.reduce<Record<string, number>>((acc, val) => {
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {});
    const maxCount = Math.max(...Object.values(counts));
    const tied = Object.keys(counts).filter((k) => counts[k] === maxCount);
    const priorityOrder = ["A", "D", "B", "C"];
    const top = tied.length === 1 ? tied[0] : priorityOrder.find((p) => tied.includes(p))!;
    const zapierTags: Record<string, string> = {
      A: "Quiz-Rebalancer",
      B: "Quiz-Doer",
      C: "Quiz-Achiever",
      D: "Quiz-Feeler",
    };

    try {
      await fetch(ZAPIER_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, result_letter: top, quiz_result: zapierTags[top] }),
      });
    } catch (_) {}

    const eventId = generateMetaEventId();
    const meta = getMetaParams();
    try {
      await submitFoodQuizLead.mutateAsync({
        email,
        contentName: "Food Quiz",
        resultLetter: top,
        eventSourceUrl: typeof window !== "undefined" ? window.location.href : undefined,
        ...meta,
        eventId,
      });
    } catch (_) {}

    trackLead({ content_name: "Food Quiz", content_category: "Quiz" }, eventId);
    ga.trackLead({ category: "Lead Generation", label: "Food Quiz Completion" });
    
    setTimeout(() => {
      router.push("/food-quiz-thank-you");
    }, 1500);
  }

  const q = questions[currentIdx];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "oklch(0.97 0.008 10)" }}>
      <SiteNav />

      <main className="flex-1 flex flex-col items-center justify-center py-16 px-4">
        {/* Header above card */}
        <div className="text-center mb-8 max-w-xl">
          <span className="badge-forest mb-3 inline-block">Free Quiz</span>
          <h1 className="font-bold mb-3" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(2rem, 4vw, 3rem)", color: "oklch(0.22 0.02 160)" }}>
            What's Really Keeping You Stuck with Food?
          </h1>
          <p className="text-base" style={{ color: "oklch(0.45 0.02 160)" }}>
            Take this <strong>60-second quiz</strong> to discover your Food + Mindset Type and get your <strong>personalized mini reset plan.</strong>
          </p>
        </div>

        {/* Quiz Card */}
        <div className="w-full max-w-2xl rounded-3xl overflow-hidden shadow-xl" style={{ background: "#ffffff", border: "1px solid oklch(0.92 0.01 160)" }}>
          {/* Progress bar */}
          <div className="h-1.5 w-full" style={{ background: "oklch(0.93 0.01 160)" }}>
            <div
              className="h-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%`, background: "oklch(0.38 0.10 148)" }}
            />
          </div>

          <div className="p-10 md:p-14">

            {/* â”€â”€ START SCREEN â”€â”€ */}
            {screen === "start" && (
              <div className="text-center animate-in fade-in duration-300">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: "oklch(0.93 0.06 75)" }}>
                  <Sparkles size={28} style={{ color: "oklch(0.45 0.12 65)" }} />
                </div>
                <h2 className="font-bold mb-4" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(1.6rem, 3vw, 2.2rem)", color: "oklch(0.22 0.02 160)" }}>
                  Ready to find your reset?
                </h2>
                <p className="text-base leading-relaxed mb-8" style={{ color: "oklch(0.45 0.02 160)", maxWidth: "420px", margin: "0 auto 2rem" }}>
                  5 quick questions. No judgment. Just clarity on what's been holding you back â€” and a personalized plan to move forward.
                </p>
                <button
                  onClick={handleStart}
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-base transition-all hover:shadow-lg hover:-translate-y-0.5"
                  style={{ background: "oklch(0.38 0.10 148)", color: "white" }}
                >
                  Start the Quiz <ArrowRight size={18} />
                </button>
              </div>
            )}

            {/* â”€â”€ QUIZ SCREEN â”€â”€ */}
            {screen === "quiz" && (
              <div key={currentIdx} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "oklch(0.55 0.02 160)" }}>
                  Question {currentIdx + 1} of {questions.length}
                </p>
                <h2 className="font-bold mb-8" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(1.4rem, 2.5vw, 1.9rem)", color: "oklch(0.22 0.02 160)", lineHeight: 1.3 }}>
                  {q.question}
                </h2>
                <div className="space-y-3">
                  {q.answers.map((ans) => {
                    const isSelected = selectedAnswer === ans.v;
                    return (
                      <button
                        key={ans.v}
                        onClick={() => handleAnswer(ans.v)}
                        disabled={!!selectedAnswer}
                        className="w-full text-left px-5 py-4 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center gap-3"
                        style={{
                          background: isSelected ? "oklch(0.38 0.10 148)" : "oklch(0.95 0.01 148)",
                          color: isSelected ? "white" : "oklch(0.28 0.02 160)",
                          border: `2px solid ${isSelected ? "oklch(0.38 0.10 148)" : "oklch(0.90 0.02 148)"}`,
                          cursor: selectedAnswer ? "default" : "pointer",
                          transform: isSelected ? "scale(1.01)" : "scale(1)",
                        }}
                      >
                        <span
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{
                            background: isSelected ? "rgba(255,255,255,0.25)" : "oklch(0.88 0.03 148)",
                            color: isSelected ? "white" : "oklch(0.38 0.10 148)",
                          }}
                        >
                          {ans.v}
                        </span>
                        {ans.text}
                        {isSelected && <CheckCircle2 size={16} className="ml-auto flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* â”€â”€ EMAIL SCREEN â”€â”€ */}
            {screen === "email" && (
              <div className="text-center animate-in fade-in duration-300">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: "oklch(0.93 0.06 75)" }}>
                  <Sparkles size={28} style={{ color: "oklch(0.45 0.12 65)" }} />
                </div>
                <h2 className="font-bold mb-3" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(1.6rem, 3vw, 2.2rem)", color: "oklch(0.22 0.02 160)" }}>
                  Almost there...
                </h2>
                <p className="text-base mb-8" style={{ color: "oklch(0.45 0.02 160)" }}>
                  Where should I send your personalized Reset Plan and Type results?
                </p>
                <div className="max-w-sm mx-auto space-y-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    placeholder="Your email address"
                    className="w-full px-5 py-4 rounded-xl text-base text-center outline-none transition-all"
                    style={{
                      border: `2px solid ${emailError ? "oklch(0.55 0.15 25)" : "oklch(0.88 0.02 148)"}`,
                      background: "oklch(0.98 0.005 148)",
                      color: "oklch(0.22 0.02 160)",
                    }}
                  />
                  {emailError && (
                    <p className="text-xs" style={{ color: "oklch(0.55 0.15 25)" }}>{emailError}</p>
                  )}
                  <button
                    onClick={handleSubmit}
                    className="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-full font-bold text-base transition-all hover:shadow-lg hover:-translate-y-0.5"
                    style={{ background: "oklch(0.38 0.10 148)", color: "white" }}
                  >
                    Show My Results <ArrowRight size={18} />
                  </button>
                  <p className="text-xs" style={{ color: "oklch(0.60 0.02 160)" }}>
                    No spam, ever. Unsubscribe anytime.
                  </p>
                </div>
              </div>
            )}

            {/* â”€â”€ SUBMITTING SCREEN â”€â”€ */}
            {screen === "submitting" && (
              <div className="text-center animate-in fade-in duration-300 py-8">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse" style={{ background: "oklch(0.93 0.06 75)" }}>
                  <Sparkles size={28} style={{ color: "oklch(0.45 0.12 65)" }} />
                </div>
                <h2 className="font-bold mb-3" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(1.6rem, 3vw, 2.2rem)", color: "oklch(0.22 0.02 160)" }}>
                  Calculating your results...
                </h2>
                <p className="text-base italic" style={{ color: "oklch(0.45 0.02 160)" }}>
                  Preparing your safe space and personalized plan...
                </p>
              </div>
            )}

          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

