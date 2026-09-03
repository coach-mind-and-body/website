"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BRAND } from "@shared/brand";
import { REAL_FOOD_RESET, REAL_FOOD_RESET_CLAIM_KEY } from "@shared/realFoodReset";
import { trpc } from "@/lib/trpc";
import { useMetaPixel } from "@/hooks/useMetaPixel";
import { getMetaParams, generateMetaEventId } from "@/hooks/useMetaParams";
import { useGoogleAnalytics } from "@/hooks/useGoogleAnalytics";

const DAYS = REAL_FOOD_RESET.days;

function SignupForm({ id, compact }: { id?: string; compact?: boolean }) {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { trackLead } = useMetaPixel();
  const ga = useGoogleAnalytics();
  const signup = trpc.leadgen.subscribeRealFoodReset.useMutation({
    onSuccess: (data, variables) => {
      if (data.claimToken && typeof window !== "undefined") {
        localStorage.setItem(REAL_FOOD_RESET_CLAIM_KEY, data.claimToken);
      }
      trackLead(
        {
          content_name: REAL_FOOD_RESET.name,
          content_category: "Challenge",
        },
        variables.eventId
      );
      ga.trackLead({ category: "Challenge", label: REAL_FOOD_RESET.shortName });
      const thankYou =
        data.claimToken
          ? `${REAL_FOOD_RESET.thankYouPath}?claim=${encodeURIComponent(data.claimToken)}`
          : REAL_FOOD_RESET.thankYouPath;
      router.push(thankYou);
    },
    onError: (err) => {
      setLoading(false);
      setError(err.message || "Something went wrong. Please try again.");
    },
  });

  async function handleSubmit() {
    if (!firstName.trim()) {
      setError("Please enter your first name.");
      return;
    }
    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    setLoading(true);
    const eventId = generateMetaEventId();
    const meta = getMetaParams();
    try {
      await signup.mutateAsync({
        firstName: firstName.trim(),
        email: email.trim(),
        contentName: REAL_FOOD_RESET.name,
        eventSourceUrl: typeof window !== "undefined" ? window.location.href : undefined,
        eventId,
        ...meta,
      });
    } catch {
      // onError
    }
  }

  return (
    <div id={id} className={compact ? "" : "w-full"}>
      <div className="flex flex-col gap-3">
        <input
          type="text"
          placeholder="First name"
          aria-label="First name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="w-full text-base rounded-xl px-4 py-4 outline-none"
          style={{ border: "1px solid #ddd", background: "#fff", color: "#2d3b2d" }}
        />
        <input
          type="email"
          placeholder="Email address"
          aria-label="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          className="w-full text-base rounded-xl px-4 py-4 outline-none"
          style={{ border: "1px solid #ddd", background: "#fff", color: "#2d3b2d" }}
        />
        {error && (
          <p className="text-sm font-semibold" style={{ color: "oklch(0.45 0.15 25)" }}>
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="w-full font-bold text-base rounded-xl py-4 transition-all hover:-translate-y-0.5 disabled:opacity-60"
          style={{
            background: "oklch(0.38 0.10 148)",
            color: "#fff",
            boxShadow: "0 10px 20px rgba(62,84,70,0.2)",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Saving your spot…" : "Yes — save my free spot"}
        </button>
        <p className="text-xs text-center leading-relaxed" style={{ color: "#8a9a8a" }}>
          Free. Progress, not perfection. We start {REAL_FOOD_RESET.startLabel}.
        </p>
      </div>
    </div>
  );
}

export default function RealFoodResetClient() {
  const { trackViewContent } = useMetaPixel();
  const ga = useGoogleAnalytics();

  useEffect(() => {
    trackViewContent({
      content_name: REAL_FOOD_RESET.name,
      content_category: "Challenge",
      content_type: "product",
    });
    ga.trackViewContent({
      item_name: REAL_FOOD_RESET.name,
      item_category: "Challenge",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "#fcfaf9", fontFamily: "'Montserrat', sans-serif", color: "#2d3b2d" }}>
      <header className="px-4 py-5 flex justify-center">
        <img src={BRAND.logoUrl} alt={BRAND.name} className="h-14 w-14 rounded-xl object-contain shadow-sm" />
      </header>

      <section className="px-4 pb-12">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] mb-4" style={{ color: "#c9a96e" }}>
              Free · 5 days · Starts {REAL_FOOD_RESET.startLabel}
            </p>
            <h1
              className="font-bold leading-[1.1] mb-4"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(2.4rem, 6vw, 4.2rem)" }}
            >
              Stop starting over.
            </h1>
            <p className="text-xl md:text-2xl font-semibold mb-5" style={{ color: "#3a5a3a" }}>
              {REAL_FOOD_RESET.name}
            </p>
            <p className="text-base md:text-lg leading-relaxed mb-6" style={{ color: "#555" }}>
              Five days to discover what’s really in your food, make simple whole-food choices, and prove to yourself that eating differently doesn’t have to be so complicated.
            </p>
            <p className="text-sm leading-relaxed mb-8" style={{ color: "#6a7a6a" }}>
              For women 40+ who are tired of diets, food rules, and promising themselves, “I’ll start again Monday.”
            </p>
            <ul className="space-y-2 text-sm mb-2" style={{ color: "#3a5a3a" }}>
              <li>✓ Lives {REAL_FOOD_RESET.liveDays} at {REAL_FOOD_RESET.liveTime}</li>
              <li>✓ Tuesday &amp; Thursday: video + recipes in the app</li>
              <li>✓ Daily check-ins, food log, and chat — app is home base</li>
            </ul>
          </div>
          <div className="p-6 md:p-8 rounded-3xl" style={{ background: "#fbeee9" }}>
            <h2 className="font-bold text-2xl mb-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Save your free spot
            </h2>
            <p className="text-sm mb-5" style={{ color: "#6a5a50" }}>
              We start {REAL_FOOD_RESET.startLabel}. You’ll get the app link and live times as soon as you register.
            </p>
            <SignupForm id="join" />
          </div>
        </div>
      </section>

      <section className="px-4 py-14" style={{ background: "#fff" }}>
        <div className="max-w-3xl mx-auto">
          <h2 className="font-bold text-3xl mb-6" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Does this sound familiar?
          </h2>
          <div className="space-y-4 text-base leading-relaxed" style={{ color: "#555" }}>
            <p>You’re trying to eat healthier. You know you <em>should</em> make better choices. Maybe you’ve tried eating less, cutting carbs, adding more protein, or swearing off certain foods completely.</p>
            <p>And for a while, you do great. Until you don’t. You’re “good” all day… then the house finally gets quiet. You’re tired. You want something sweet. You start grazing.</p>
            <p>“I’ll just have one.” “One more won’t hurt.” “I was good today. I deserve this.”</p>
            <p>The next morning? Here come all the shoulds and shouldn’ts. “I’ll start over Monday.”</p>
            <p className="font-semibold" style={{ color: "#2d3b2d" }}>What if you didn’t need another Monday?</p>
          </div>
        </div>
      </section>

      <section className="px-4 py-14">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-bold text-3xl mb-3" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Here’s what we’ll cover
          </h2>
          <p className="mb-8" style={{ color: "#6a7a6a" }}>
            Not another diet. Not five days of trying to be perfect. Curiosity, skills, and practice.
          </p>
          <div className="grid gap-4">
            {DAYS.map((d) => (
              <div
                key={d.n}
                className="p-5 rounded-2xl border bg-white"
                style={{ borderColor: "#f0e8e4" }}
              >
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-2">
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#c9a96e" }}>
                    Day {d.n} · {d.weekday}
                  </span>
                  <span className="text-xs" style={{ color: "#8a9a8a" }}>
                    {d.format}
                  </span>
                </div>
                <h3 className="font-bold text-lg mb-1">{d.title}</h3>
                <p className="text-sm" style={{ color: "#555" }}>
                  Your win: {d.win}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-14" style={{ background: "#fff" }}>
        <div className="max-w-3xl mx-auto">
          <h2 className="font-bold text-3xl mb-6" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            The app is home base
          </h2>
          <p className="text-base leading-relaxed mb-4" style={{ color: "#555" }}>
            Valerie Diane’s challenge builder was five days of hour-long lives. We’re keeping the live teaching — three days, not five — and putting the rest where you already have a phone in your hand.
          </p>
          <ul className="space-y-3 text-base" style={{ color: "#3a5a3a" }}>
            <li><strong>Daily check-in</strong> in the app (push will nudge you).</li>
            <li><strong>Food log</strong> so you can see patterns, not just remember them.</li>
            <li><strong>Chat</strong> if you have a question between lives.</li>
            <li><strong>Mon / Wed / Fri</strong> live Google Meet, {REAL_FOOD_RESET.liveTime}, {REAL_FOOD_RESET.liveDuration}. Replays in the app.</li>
            <li><strong>Tue / Thu</strong> a short video plus recipes/guide — no live call those days.</li>
          </ul>
          <p className="mt-6 text-sm" style={{ color: "#6a7a6a" }}>
            Facebook is optional community, not the homework. If you miss a live, watch the replay and check the day off anyway.
          </p>
        </div>
      </section>

      <section className="px-4 py-14">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-bold text-3xl mb-4" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Progress, not perfection
          </h2>
          <p className="text-base leading-relaxed mb-4" style={{ color: "#555" }}>
            This is not a “zero processed food or you failed” contest. One choice you aren’t happy with doesn’t mean you’ve blown the day. You don’t throw away the rest of the week. You don’t wait until Monday.
          </p>
          <p className="text-base leading-relaxed font-semibold">
            Ask: “What did I learn, and what choice do I want to make next?” Then keep going. That’s the practice.
          </p>
        </div>
      </section>

      <section className="px-4 py-14" style={{ background: "#fff" }}>
        <div className="max-w-3xl mx-auto">
          <h2 className="font-bold text-3xl mb-6" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            This is for you if…
          </h2>
          <ul className="space-y-3 text-base" style={{ color: "#555" }}>
            <li>✓ You’re a woman over 40 who wants to eat healthier but feels overwhelmed about where to start.</li>
            <li>✓ You’re tired of a new diet every time the last one doesn’t stick.</li>
            <li>✓ You do great all day… then graze or crave sweets when the house gets quiet.</li>
            <li>✓ You think eating less processed food will be too hard, expensive, or time-consuming.</li>
            <li>✓ You’re tired of saying “I’ll start again Monday.”</li>
          </ul>
        </div>
      </section>

      <section className="px-4 py-14">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-bold text-3xl mb-8" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            What women tell Lee Anne
          </h2>
          <div className="space-y-6">
            <blockquote className="p-6 rounded-2xl" style={{ background: "#f9f5f0" }}>
              <p className="leading-relaxed mb-3" style={{ color: "#555" }}>
                “Working with Lee Anne helped me understand that sugar cravings and brain chatter aren’t personal failures. They’re science. That awareness alone has changed how I make choices.”
              </p>
              <cite className="text-sm font-bold not-italic">— Marianne</cite>
            </blockquote>
            <blockquote className="p-6 rounded-2xl" style={{ background: "#f9f5f0" }}>
              <p className="leading-relaxed mb-3" style={{ color: "#555" }}>
                “She helps women step out of the quick-fix mindset and into a long-term approach. You feel empowered to take ownership of your health in a way that lasts.”
              </p>
              <cite className="text-sm font-bold not-italic">— Sherylee</cite>
            </blockquote>
          </div>
        </div>
      </section>

      <section className="px-4 py-14" style={{ background: "#fff" }}>
        <div className="max-w-3xl mx-auto grid md:grid-cols-[160px_1fr] gap-8 items-start">
          <img
            src={BRAND.coachImageUrl}
            alt="Lee Anne Chapman"
            className="w-40 h-40 rounded-2xl object-cover mx-auto md:mx-0"
          />
          <div>
            <h2 className="font-bold text-3xl mb-3" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Hi, I’m Lee Anne
            </h2>
            <p className="text-sm font-semibold mb-3" style={{ color: "#c9a96e" }}>
              Certified Life &amp; Health Coach
            </p>
            <p className="text-base leading-relaxed" style={{ color: "#555" }}>
              I help women over 40 move away from the constant food rules, negotiations, and “starting over” mentality so they can build healthier habits and feel more confident around food. I’m not interested in another list of rules. I want you to understand your choices and practice skills you can actually use in real life.
            </p>
          </div>
        </div>
      </section>

      <section className="px-4 py-14">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-bold text-3xl mb-6" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            FAQ
          </h2>
          <dl className="space-y-6 text-base">
            <div>
              <dt className="font-bold mb-1">Is it really free?</dt>
              <dd style={{ color: "#555" }}>Yes. No charge to participate.</dd>
            </div>
            <div>
              <dt className="font-bold mb-1">When does it start?</dt>
              <dd style={{ color: "#555" }}>
                {REAL_FOOD_RESET.startLabel} through {REAL_FOOD_RESET.endLabel}. Lives {REAL_FOOD_RESET.liveDays} at {REAL_FOOD_RESET.liveTime} ({REAL_FOOD_RESET.liveDuration}).
              </dd>
            </div>
            <div>
              <dt className="font-bold mb-1">Is this a diet?</dt>
              <dd style={{ color: "#555" }}>
                No. It’s five days of skills: processed vs. whole food, labels, added sugar, balanced meals, and real-life swaps. Progress, not perfection.
              </dd>
            </div>
            <div>
              <dt className="font-bold mb-1">Do I have to eat perfectly for all five days?</dt>
              <dd style={{ color: "#555" }}>No. Participation, awareness, and practice — not a perfect streak.</dd>
            </div>
            <div>
              <dt className="font-bold mb-1">Where does it happen?</dt>
              <dd style={{ color: "#555" }}>
                The app is home base (check-ins, food log, videos, chat, push). Google Meet for the three lives — the join button appears in the app after you enroll. Email as a backup nudge.
              </dd>
            </div>
            <div>
              <dt className="font-bold mb-1">Do I need special foods?</dt>
              <dd style={{ color: "#555" }}>No. You’ll get food suggestions and recipes for the five days.</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="px-4 py-16" style={{ background: "#fbeee9" }}>
        <div className="max-w-md mx-auto text-center">
          <h2 className="font-bold text-3xl mb-3" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Five days. That’s it.
          </h2>
          <p className="mb-6" style={{ color: "#5a4a40" }}>
            You don’t need to figure out the next six months today. Come exactly as you are.
          </p>
          <SignupForm />
        </div>
      </section>

      <footer className="px-4 py-8 text-center text-xs" style={{ color: "#8a9a8a" }}>
        {BRAND.name} · {BRAND.coachFullName}
      </footer>

      <div className="lg:hidden sticky bottom-0 p-3" style={{ background: "rgba(252,250,249,0.95)", borderTop: "1px solid #f0e8e4" }}>
        <a
          href="#join"
          className="block text-center font-bold rounded-xl py-3"
          style={{ background: "oklch(0.38 0.10 148)", color: "#fff" }}
        >
          Save my free spot
        </a>
      </div>
    </div>
  );
}
