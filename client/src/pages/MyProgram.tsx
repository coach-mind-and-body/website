import { useEffect } from "react";
import { Link } from "wouter";
import { CheckCircle2, Clock, Calendar, Lock, ArrowRight } from "lucide-react";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { PROGRAM, GOOGLE_CALENDAR, BRAND } from "../../../shared/brand";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

const SESSION_LABELS = [
  "Session 1 — Foundation & Discovery",
  "Session 2 — Mindset Deep Dive",
  "Session 3 — Body Wisdom",
  "Session 4 — Nutrition & Hormones",
  "Session 5 — Integration",
  "Session 6 — Maintenance & Future",
];

const STATUS_CONFIG = {
  not_scheduled: { label: "Not Scheduled", icon: <Clock size={14} />, color: "oklch(0.55 0.02 160)", bg: "oklch(0.93 0.01 160)" },
  scheduled: { label: "Scheduled", icon: <Calendar size={14} />, color: "oklch(0.45 0.12 65)", bg: "oklch(0.93 0.06 75)" },
  completed: { label: "Completed", icon: <CheckCircle2 size={14} />, color: "oklch(0.38 0.10 148)", bg: "oklch(0.92 0.04 148)" },
  cancelled: { label: "Cancelled", icon: <Clock size={14} />, color: "oklch(0.55 0.02 160)", bg: "oklch(0.93 0.01 160)" },
  locked: { label: "Locked", icon: <Lock size={14} />, color: "oklch(0.60 0.02 160)", bg: "oklch(0.95 0.01 160)" },
};

export default function MyProgram() {
  const { user, loading, isAuthenticated } = useAuth();
  const { data, isLoading } = trpc.enrollment.myEnrollment.useQuery(undefined, { enabled: isAuthenticated });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [loading, isAuthenticated]);

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "oklch(0.97 0.008 10)" }}>
        <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "oklch(0.72 0.12 75)" }} />
      </div>
    );
  }

  // No enrollment found — show a prompt to enroll
  if (!data) {
    return (
      <div className="min-h-screen" style={{ background: "oklch(0.97 0.008 10)" }}>
        <SiteNav />
        <div className="container max-w-xl mx-auto py-24 text-center">
          <img src={BRAND.logoUrl} alt={BRAND.name} className="w-24 h-24 rounded-full object-cover mx-auto mb-6" />
          <h1 className="font-bold text-3xl mb-4" style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.22 0.02 160)" }}>
            Welcome, {user?.name?.split(" ")[0] ?? "Friend"}!
          </h1>
          <p className="text-base mb-8" style={{ color: "oklch(0.45 0.02 160)" }}>
            It looks like you haven't enrolled in the R.E.C.L.A.I.M. program yet. Ready to get started?
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/enroll" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-bold text-sm transition-all hover:shadow-lg" style={{ background: "oklch(0.22 0.02 160)", color: "oklch(0.97 0.008 10)" }}>
              Enroll in R.E.C.L.A.I.M. <ArrowRight size={16} />
            </Link>
            <Link href="/book" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-bold text-sm border-2 transition-all" style={{ borderColor: "oklch(0.22 0.02 160)", color: "oklch(0.22 0.02 160)" }}>
              Book Free Discovery Call
            </Link>
          </div>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const { enrollment, sessions } = data;
  const completedCount = sessions.filter(s => s.status === "completed").length;
  const nextSession = sessions.find(s => s.status === "scheduled" || s.status === "not_scheduled");
  const allComplete = completedCount === PROGRAM.sessionCount;

  return (
    <div className="min-h-screen" style={{ background: "oklch(0.97 0.008 10)" }}>
      <SiteNav />

      {/* Header */}
      <section className="py-14" style={{ background: "oklch(0.22 0.02 160)" }}>
        <div className="container max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <img src={BRAND.logoUrl} alt={BRAND.name} className="w-14 h-14 rounded-full object-cover" />
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "oklch(0.72 0.12 75)" }}>My Program</p>
              <h1 className="font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(1.6rem, 3vw, 2.4rem)", color: "oklch(0.97 0.008 10)" }}>
                Welcome back, {user?.name?.split(" ")[0] ?? "Friend"}
              </h1>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mb-2 flex justify-between text-xs" style={{ color: "oklch(0.65 0.02 160)" }}>
            <span>Your Progress</span>
            <span>{completedCount} of {PROGRAM.sessionCount} sessions complete</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "oklch(0.42 0.02 160)" }}>
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(completedCount / PROGRAM.sessionCount) * 100}%`, background: "oklch(0.72 0.12 75)" }} />
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Session list */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="font-bold text-xl mb-6" style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.22 0.02 160)" }}>
                Your 6 Sessions
              </h2>
              {SESSION_LABELS.map((label, idx) => {
                const sessionNum = idx + 1;
                const session = sessions.find(s => s.sessionNumber === sessionNum);
                const isCompleted = session?.status === "completed";
                const isScheduled = session?.status === "scheduled";
                const isNotScheduled = session?.status === "not_scheduled" || !session;

                // Determine if this session is bookable (previous session completed or it's session 1)
                const prevCompleted = sessionNum === 1 || sessions.find(s => s.sessionNumber === sessionNum - 1)?.status === "completed";
                const canBook = prevCompleted && !isCompleted && !isScheduled;

                const statusKey = isCompleted ? "completed" : isScheduled ? "scheduled" : canBook ? "not_scheduled" : "locked";
                const cfg = STATUS_CONFIG[statusKey];

                return (
                  <div key={idx} className="rounded-xl p-5 card-brand" style={{ opacity: statusKey === "locked" ? 0.5 : 1 }}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0" style={{ background: cfg.bg, color: cfg.color }}>
                          {isCompleted ? <CheckCircle2 size={18} /> : sessionNum}
                        </div>
                        <div>
                          <h3 className="font-bold text-base mb-1" style={{ color: "oklch(0.22 0.02 160)" }}>{label}</h3>
                          {session?.scheduledAt && (
                            <p className="text-xs mb-1" style={{ color: "oklch(0.55 0.02 160)" }}>
                              {new Date(session.scheduledAt).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </p>
                          )}
                          {session?.googleMeetLink && (
                            <a href={session.googleMeetLink} target="_blank" rel="noopener noreferrer" className="text-xs font-bold underline" style={{ color: "oklch(0.38 0.10 148)" }}>
                              Join Google Meet →
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold flex-shrink-0" style={{ background: cfg.bg, color: cfg.color }}>
                        {cfg.icon} {cfg.label}
                      </div>
                    </div>
                    {canBook && (
                      <div className="mt-4 pt-4 border-t" style={{ borderColor: "oklch(0.90 0.01 160)" }}>
                        <p className="text-xs mb-3" style={{ color: "oklch(0.55 0.02 160)" }}>
                          {sessionNum === 1 ? "Book your first session to get started!" : "Your previous session is complete — book your next one!"}
                        </p>
                        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid oklch(0.90 0.01 160)" }}>
                          <iframe
                            src={GOOGLE_CALENDAR.reclaimSession}
                            style={{ border: 0, display: "block" }}
                            width="100%"
                            height="400"
                            frameBorder="0"
                            title={`Book ${label}`}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Sidebar */}
            <div className="space-y-5">
              {/* Enrollment details */}
              <div className="card-brand rounded-2xl p-5">
                <h3 className="font-bold text-base mb-4" style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.22 0.02 160)" }}>Program Details</h3>
                <div className="space-y-2 text-sm">
                  {[
                    { label: "Program", value: PROGRAM.name },
                    { label: "Sessions", value: `${completedCount} / ${PROGRAM.sessionCount} complete` },
                    { label: "Duration", value: `${PROGRAM.sessionDurationMins} min each` },
                    { label: "Enrolled", value: enrollment.enrolledAt ? new Date(enrollment.enrolledAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—" },
                    { label: "Status", value: enrollment.status ?? "Active" },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between">
                      <span style={{ color: "oklch(0.55 0.02 160)" }}>{item.label}</span>
                      <span className="font-semibold" style={{ color: "oklch(0.22 0.02 160)" }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Post-program (if all sessions done) */}
              {allComplete && (
                <div className="rounded-2xl p-5" style={{ background: "oklch(0.92 0.04 148)", border: "1px solid oklch(0.38 0.10 148)" }}>
                  <CheckCircle2 size={24} className="mb-3" style={{ color: "oklch(0.38 0.10 148)" }} />
                  <h3 className="font-bold text-base mb-2" style={{ color: "oklch(0.22 0.02 160)" }}>You Did It!</h3>
                  <p className="text-xs mb-4" style={{ color: "oklch(0.42 0.02 160)" }}>Congratulations on completing the R.E.C.L.A.I.M. program. Lee Anne will be in touch with your follow-up resources.</p>
                  <a href="mailto:leeanne@mindandbodyresetcoach.com" className="inline-flex items-center gap-1 text-xs font-bold" style={{ color: "oklch(0.38 0.10 148)" }}>
                    Contact Lee Anne <ArrowRight size={12} />
                  </a>
                </div>
              )}

              {/* Quick links */}
              <div className="card-brand rounded-2xl p-5">
                <h3 className="font-bold text-sm mb-3" style={{ color: "oklch(0.22 0.02 160)" }}>Quick Links</h3>
                <div className="space-y-2">
                  <Link href="/health-wellness-blog" className="flex items-center gap-2 text-xs font-semibold" style={{ color: "oklch(0.38 0.10 148)" }}>
                    <ArrowRight size={12} /> Read the Blog
                  </Link>
                  <Link href="/reclaim" className="flex items-center gap-2 text-xs font-semibold" style={{ color: "oklch(0.38 0.10 148)" }}>
                    <ArrowRight size={12} /> Program Overview
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
