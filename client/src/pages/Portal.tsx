import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { CheckCircle2, Clock, Lock, Video, Upload, FileText, Calendar, ChevronDown, ChevronUp, X, CreditCard, DollarSign, AlertCircle, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { BRAND } from "../../../shared/brand";
import { Link } from "wouter";
import { usePageTitle } from "@/hooks/usePageTitle";

const SESSION_LABELS = [
  "Discovery & Reset Foundation",
  "Food Noise & Mindset Mapping",
  "Hormones, Hunger & Habits",
  "Movement & Energy Reset",
  "Emotional Eating & Identity",
  "Integration & Your Life Forward",
];

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Portal() {
  usePageTitle({
    title: "Client Portal | Mind and Body Reset",
    description: "Your personal coaching portal — access program materials, schedule sessions, and track your wellness journey with Mind & Body Reset.",
    keywords: "client portal, coaching portal, program access, wellness dashboard"
  });
  const { user, loading, isAuthenticated } = useAuth();
  const [expandedSession, setExpandedSession] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeUploadEnrollmentId, setActiveUploadEnrollmentId] = useState<number | null>(null);

  const { data, isLoading, refetch } = trpc.enrollment.myEnrollment.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: paymentData, isLoading: loadingPayments } = trpc.payment.myPayments.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: fpuData, isLoading: fpuLoading } = trpc.fpu.myCoaching.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: filesData, refetch: refetchFiles } = trpc.clientFiles.list.useQuery(
    { enrollmentId: data?.enrollment?.id ?? 0 },
    { enabled: !!data?.enrollment?.id }
  );

  const { data: upcomingEvents, isLoading: upcomingLoading } = trpc.reclaimHub.getUpcomingAppointments.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const uploadFile = trpc.clientFiles.upload.useMutation({
    onSuccess: () => {
      toast.success("File uploaded successfully!");
      refetchFiles();
      setUploading(false);
    },
    onError: (e) => {
      toast.error(e.message);
      setUploading(false);
    },
  });

  // Auto-link deposit to account when user has no enrollment
  // This handles the case where a client paid before creating their account
  const utils = trpc.useUtils();
  const linkDeposit = trpc.payment.linkDepositToAccount.useMutation({
    onSuccess: (result) => {
      if (result.linked) {
        toast.success("Your enrollment has been linked to your account!");
        utils.enrollment.myEnrollment.invalidate();
        refetch();
      }
    },
  });
  const hasAttemptedLink = useRef(false);
  useEffect(() => {
    if (
      isAuthenticated &&
      !isLoading &&
      !fpuLoading &&
      !data?.enrollment &&
      !fpuData &&
      !hasAttemptedLink.current
    ) {
      hasAttemptedLink.current = true;
      linkDeposit.mutate();
    }
  }, [isAuthenticated, isLoading, fpuLoading, data, fpuData]);

  if (!loading && !isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  if (loading || isLoading || fpuLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#faf5f5" }}>
        <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#c9a96e" }} />
      </div>
    );
  }

  if (!data?.enrollment && !fpuData) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#faf5f5" }}>
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#fbeee9" }}>
            <Lock size={28} style={{ color: "#c9a96e" }} />
          </div>
          <h1 className="text-2xl font-bold mb-3" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#2d3b2d" }}>
            No Active Program
          </h1>
          <p className="text-base mb-6" style={{ color: "#5a6b5a" }}>
            You don't have an active program yet. Enroll in R.E.C.L.A.I.M. or add FPU coaching to access your client portal.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/enroll" className="inline-block px-6 py-3 rounded-full font-bold text-white" style={{ background: "#c9a96e" }}>
                Enroll in R.E.C.L.A.I.M.
            </Link>
            <Link href="/financial-peace" className="inline-block px-6 py-3 rounded-full font-bold border" style={{ borderColor: "#c9a96e", color: "#c9a96e" }}>
                Add FPU Coaching
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const enrollment = data?.enrollment ?? null;
  const sessions = data?.sessions ?? [];
  const completedCount = sessions.filter((s: { status: string }) => s.status === "completed").length;
  const totalSessions = 6;
  const progressPct = Math.round((completedCount / totalSessions) * 100);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeUploadEnrollmentId) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be under 10MB");
      return;
    }
    setUploading(true);
    try {
      const base64Data = await fileToBase64(file);
      await uploadFile.mutateAsync({
        enrollmentId: activeUploadEnrollmentId,
        fileName: file.name,
        mimeType: file.type,
        base64Data,
      });
    } catch {
      setUploading(false);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="min-h-screen" style={{ background: "#faf5f5" }}>
      {/* Header */}
      <header className="border-b" style={{ background: "white", borderColor: "#f0e8e4" }}>
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3">
              <img src={BRAND.logoUrl} alt={BRAND.name} className="w-8 h-8 rounded-full object-cover" />
              <span className="font-bold hidden sm:block" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#2d3b2d", fontSize: "1.1rem" }}>
                Mind & Body Reset
              </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/habit-tracker" className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm" style={{ background: "#fbeee9", color: "#c9a96e" }}>
              <CheckCircle2 size={14} /> My Daily Reset
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: "#fbeee9", color: "#c9a96e" }}>
                {user?.name?.[0] ?? "C"}
              </div>
              <span className="text-sm font-semibold hidden sm:block" style={{ color: "#2d3b2d" }}>{user?.name}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Welcome banner */}
        <div className="rounded-2xl p-8 mb-8" style={{ background: "linear-gradient(135deg, #fbeee9 0%, #faf5f5 100%)", border: "1px solid #f0e8e4" }}>
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#2d3b2d" }}>
            Welcome back, {user?.name?.split(" ")[0] ?? "there"} 👋
          </h1>
          {enrollment ? (
            <>
              <p className="text-base mb-6" style={{ color: "#5a6b5a" }}>
                Your R.E.C.L.A.I.M. journey is underway. Here's where you stand.
              </p>
              {/* Progress bar */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: "#f0e8e4" }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${progressPct}%`, background: "linear-gradient(90deg, #c9a96e, #e8c99a)" }}
                  />
                </div>
                <span className="text-sm font-bold whitespace-nowrap" style={{ color: "#c9a96e" }}>
                  {completedCount} / {totalSessions} sessions
                </span>
              </div>
              <p className="text-xs mt-2" style={{ color: "#8a9a8a" }}>
                {enrollment.paymentType === "full" ? "Paid in Full ✓" : "Deposit Paid — Balance Due Before Session 3"}
              </p>
              <div className="mt-6">
                <Link href="/portal/hub" className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm transition-transform hover:scale-105 shadow-sm" style={{ background: "#c9a96e", color: "white" }}>
                  <BookOpen size={16} /> Enter Reclaim Hub
                </Link>
              </div>
            </>
          ) : (
            <p className="text-base" style={{ color: "#5a6b5a" }}>
              Your coaching portal — manage sessions, files, and more.
            </p>
          )}
        </div>

        {/* Upcoming Events Section */}
        {upcomingEvents && upcomingEvents.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#2d3b2d" }}>
              Upcoming Sessions
            </h2>
            <div className="space-y-3">
              {upcomingEvents.map((event: any) => (
                <div key={event.id} className="rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4" style={{ background: "white", border: "1px solid #f0e8e4" }}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#e8f5e9", color: "#4caf50" }}>
                      <Video size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-sm" style={{ color: "#2d3b2d" }}>
                        {event.summary}
                      </p>
                      <p className="text-xs mt-0.5 font-semibold" style={{ color: "#8a9a8a" }}>
                        {new Date(event.startTime).toLocaleString()} — {new Date(event.endTime).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  {event.meetLink && (
                    <a
                      href={event.meetLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold shadow-sm transition-transform hover:scale-105"
                      style={{ background: "#1a73e8", color: "white" }}
                    >
                      <Video size={16} /> Join Google Meet
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RECLAIM Sessions — only shown for enrolled clients */}
        {enrollment && <>
        <h2 className="text-xl font-bold mb-4" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#2d3b2d" }}>
          Your R.E.C.L.A.I.M. Sessions
        </h2>
        <div className="space-y-3 mb-10">
          {Array.from({ length: totalSessions }, (_, i) => {
            const sessionNum = i + 1;
            const session = sessions.find(s => s.sessionNumber === sessionNum);
            const status = session?.status ?? "not_scheduled";
            const isCompleted = status === "completed";
            const isScheduled = status === "scheduled";
            const isLocked = !isCompleted && !isScheduled && sessionNum > (completedCount + 1);
            const isExpanded = expandedSession === sessionNum;

            return (
              <div
                key={sessionNum}
                className="rounded-xl overflow-hidden"
                style={{ background: "white", border: "1px solid #f0e8e4", opacity: isLocked ? 0.6 : 1 }}
              >
                <button
                  className="w-full flex items-center justify-between p-5 text-left"
                  onClick={() => !isLocked && setExpandedSession(isExpanded ? null : sessionNum)}
                  disabled={isLocked}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        background: isCompleted ? "#e8f5e9" : isScheduled ? "#fbeee9" : "#f5f5f5",
                        color: isCompleted ? "#4caf50" : isScheduled ? "#c9a96e" : "#aaa",
                      }}
                    >
                      {isCompleted ? <CheckCircle2 size={20} /> : isScheduled ? <Clock size={20} /> : isLocked ? <Lock size={18} /> : <Calendar size={18} />}
                    </div>
                    <div>
                      <p className="font-bold text-sm" style={{ color: "#2d3b2d" }}>
                        Session {sessionNum}: {SESSION_LABELS[i]}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "#8a9a8a" }}>
                        {isCompleted
                          ? `Completed ${session?.completedAt ? new Date(session.completedAt).toLocaleDateString() : ""}`
                          : isScheduled && session?.scheduledAt
                          ? `Scheduled: ${new Date(session.scheduledAt).toLocaleString()}`
                          : isLocked
                          ? "Complete previous sessions to unlock"
                          : "Not yet scheduled"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isScheduled && session?.googleMeetLink && (
                      <a
                        href={session.googleMeetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                        style={{ background: "#1a73e8", color: "white" }}
                      >
                        <Video size={12} /> Join Meet
                      </a>
                    )}
                    {!isLocked && (isExpanded ? <ChevronUp size={16} style={{ color: "#8a9a8a" }} /> : <ChevronDown size={16} style={{ color: "#8a9a8a" }} />)}
                  </div>
                </button>

                {isExpanded && !isLocked && (
                  <div className="px-5 pb-5 border-t" style={{ borderColor: "#f0e8e4" }}>
                    {/* Schedule button for not_scheduled sessions */}
                    {status === "not_scheduled" && (
                      <div className="mt-4">
                        <p className="text-sm mb-3" style={{ color: "#5a6b5a" }}>
                          Ready to book Session {sessionNum}? Use the button below to pick a time that works for you.
                        </p>
                        <GoogleCalendarBookingButton sessionNumber={sessionNum} />
                      </div>
                    )}
                    {session?.adminNotes && (
                      <div className="mt-4 p-4 rounded-xl" style={{ background: "#faf5f5" }}>
                        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#8a9a8a" }}>Coach Notes</p>
                        <p className="text-sm" style={{ color: "#2d3b2d" }}>{session.adminNotes}</p>
                      </div>
                    )}
                    {!session?.adminNotes && status !== "not_scheduled" && (
                      <p className="mt-4 text-sm" style={{ color: "#8a9a8a" }}>No notes for this session yet.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Files section */}
        <div className="rounded-2xl p-6" style={{ background: "white", border: "1px solid #f0e8e4" }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#2d3b2d" }}>
              Shared Files
            </h2>
            <button
              onClick={() => {
                setActiveUploadEnrollmentId(enrollment?.id ?? 0);
                fileInputRef.current?.click();
              }}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all"
              style={{ background: "#fbeee9", color: "#c9a96e" }}
            >
              {uploading ? (
                <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#c9a96e" }} />
              ) : (
                <Upload size={14} />
              )}
              {uploading ? "Uploading..." : "Upload File"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.mp4,.mov,.txt"
              onChange={handleFileUpload}
            />
          </div>

          {!filesData?.length ? (
            <div className="text-center py-8">
              <FileText size={32} className="mx-auto mb-3" style={{ color: "#d0c0b8" }} />
              <p className="text-sm" style={{ color: "#8a9a8a" }}>No files yet. Upload food journals, worksheets, or anything you'd like to share with your coach.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filesData.map(file => (
                <div key={file.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "#faf5f5" }}>
                  <div className="flex items-center gap-3">
                    <FileText size={16} style={{ color: "#c9a96e" }} />
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "#2d3b2d" }}>{file.fileName}</p>
                      <p className="text-xs" style={{ color: "#8a9a8a" }}>
                        {file.uploadedByRole === "admin" ? "From your coach" : "Uploaded by you"} · {new Date(file.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <a
                    href={file.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold px-3 py-1.5 rounded-full"
                    style={{ background: "#fbeee9", color: "#c9a96e" }}
                  >
                    View
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* End RECLAIM section */}
        </>}

        {/* FPU Coaching Section */}
        {fpuData && <FpuCoachingSection order={fpuData.order} sessions={fpuData.sessions} />}

        {/* Payment History */}
        <PaymentHistorySection data={paymentData} isLoading={loadingPayments} />

        {/* Book a call CTA */}
        <div className="mt-8 rounded-2xl p-6 text-center" style={{ background: "linear-gradient(135deg, #2d3b2d, #3d4f3d)" }}>
          <h3 className="text-xl font-bold mb-2 text-white" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Need support between sessions?
          </h3>
          <p className="text-sm mb-4" style={{ color: "#a0b8a0" }}>
            Reach out anytime — we're here to support your reset journey.
          </p>
          <Link href="/book" className="inline-block px-6 py-3 rounded-full font-bold text-sm" style={{ background: "#c9a96e", color: "white" }}>
              Book a Support Call
          </Link>
        </div>
      </div>
    </div>
  );
}

const FPU_SESSION_LABELS = [
  "Foundation & Financial Clarity",
  "Accountability & Action Plan",
  "Integration & Your Path Forward",
];

function FpuCoachingSection({ order, sessions }: { order: any; sessions: any[] }) {
  return (
    <div className="mt-8 rounded-2xl p-6" style={{ background: "white", border: "1px solid #f0e8e4" }}>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "#e8f0e8", color: "#2d3b2d" }}>
          <Calendar size={18} />
        </div>
        <div>
          <h2 className="text-xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#2d3b2d" }}>
            FPU 1:1 Accountability Coaching
          </h2>
          <p className="text-xs" style={{ color: "#8a9a8a" }}>
            3 private 50-minute sessions · {order.status === "paid" ? "Paid ✓" : "Pending payment"}
          </p>
        </div>
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }, (_, i) => {
          const sessionNum = i + 1;
          const session = sessions.find((s: any) => s.sessionNumber === sessionNum);
          const status = session?.status ?? "not_scheduled";
          const isCompleted = status === "completed";
          const isScheduled = status === "scheduled";
          const isLocked = !isCompleted && !isScheduled && sessionNum > (sessions.filter((s: any) => s.status === "completed").length + 1);
          return (
            <div
              key={sessionNum}
              className="rounded-xl p-4 flex items-center justify-between gap-4"
              style={{ background: "#faf5f5", border: "1px solid #f0e8e4", opacity: isLocked ? 0.6 : 1 }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: isCompleted ? "#e8f5e9" : isScheduled ? "#fbeee9" : "#f5f5f5",
                    color: isCompleted ? "#4caf50" : isScheduled ? "#c9a96e" : "#aaa",
                  }}
                >
                  {isCompleted ? <CheckCircle2 size={16} /> : isScheduled ? <Clock size={16} /> : isLocked ? <Lock size={14} /> : <Calendar size={14} />}
                </div>
                <div>
                  <p className="font-bold text-sm" style={{ color: "#2d3b2d" }}>
                    Session {sessionNum}: {FPU_SESSION_LABELS[i]}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "#8a9a8a" }}>
                    {isCompleted
                      ? `Completed ${session?.completedAt ? new Date(session.completedAt).toLocaleDateString() : ""}`
                      : isScheduled && session?.scheduledAt
                      ? `Scheduled: ${new Date(session.scheduledAt).toLocaleString()}`
                      : isLocked
                      ? "Complete previous sessions to unlock"
                      : "Not yet scheduled"}
                  </p>
                </div>
              </div>
              {!isLocked && !isCompleted && (
                <GoogleCalendarBookingButton sessionNumber={sessionNum} />
              )}
              {isScheduled && session?.googleMeetLink && (
                <a
                  href={session.googleMeetLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold flex-shrink-0"
                  style={{ background: "#1a73e8", color: "white" }}
                >
                  <Video size={12} /> Join Meet
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PaymentHistorySection({ data, isLoading }: { data: any; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="mt-8 rounded-2xl p-6" style={{ background: "white", border: "1px solid #f0e8e4" }}>
        <div className="flex justify-center py-6">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#c9a96e" }} />
        </div>
      </div>
    );
  }

  if (!data?.enrollment) return null;

  const { enrollment, summary } = data;

  return (
    <div className="mt-8 rounded-2xl p-6" style={{ background: "white", border: "1px solid #f0e8e4" }}>
      <h2 className="text-xl font-bold mb-5" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#2d3b2d" }}>
        Payment Summary
      </h2>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl p-4" style={{ background: "#faf5f5", border: "1px solid #f0e8e4" }}>
          <div className="flex items-center gap-2 mb-1">
            <DollarSign size={14} style={{ color: "#c9a96e" }} />
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#8a9a8a" }}>Program Cost</span>
          </div>
          <p className="text-2xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#2d3b2d" }}>
            ${summary.programCost}
          </p>
        </div>
        <div className="rounded-xl p-4" style={{ background: summary.isFullyPaid ? "#e8f5e9" : "#fbeee9", border: `1px solid ${summary.isFullyPaid ? "#c8e6c9" : "#f0e8e4"}` }}>
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 size={14} style={{ color: summary.isFullyPaid ? "#4caf50" : "#c9a96e" }} />
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#8a9a8a" }}>Amount Paid</span>
          </div>
          <p className="text-2xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", color: summary.isFullyPaid ? "#4caf50" : "#c9a96e" }}>
            ${summary.amountPaid}
          </p>
        </div>
        <div className="rounded-xl p-4" style={{ background: summary.balanceRemaining > 0 ? "#fff8e1" : "#e8f5e9", border: `1px solid ${summary.balanceRemaining > 0 ? "#ffe082" : "#c8e6c9"}` }}>
          <div className="flex items-center gap-2 mb-1">
            {summary.balanceRemaining > 0 ? (
              <AlertCircle size={14} style={{ color: "#f9a825" }} />
            ) : (
              <CheckCircle2 size={14} style={{ color: "#4caf50" }} />
            )}
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#8a9a8a" }}>Balance Due</span>
          </div>
          <p className="text-2xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", color: summary.balanceRemaining > 0 ? "#f9a825" : "#4caf50" }}>
            {summary.isFullyPaid ? "Paid in Full" : `$${summary.balanceRemaining}`}
          </p>
        </div>
      </div>

      {/* Payment details */}
      <div className="rounded-xl p-4" style={{ background: "#faf5f5" }}>
        <div className="flex items-center gap-3 mb-3">
          <CreditCard size={16} style={{ color: "#c9a96e" }} />
          <span className="text-sm font-bold" style={{ color: "#2d3b2d" }}>Payment Details</span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span style={{ color: "#8a9a8a" }}>Plan Type</span>
            <span className="font-semibold" style={{ color: "#2d3b2d" }}>
              {enrollment.paymentType === "full" ? "Full Payment" : "Deposit + Balance"}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span style={{ color: "#8a9a8a" }}>Deposit Status</span>
            <span className="font-semibold" style={{ color: enrollment.depositPaid ? "#4caf50" : "#f9a825" }}>
              {enrollment.depositPaid ? "Paid \u2713" : "Pending"}
            </span>
          </div>
          {enrollment.paymentType === "deposit" && (
            <div className="flex justify-between items-center text-sm">
              <span style={{ color: "#8a9a8a" }}>Balance ($397)</span>
              <span className="font-semibold" style={{ color: enrollment.balancePaid ? "#4caf50" : "#f9a825" }}>
                {enrollment.balancePaid ? "Paid \u2713" : "Due before Session 1"}
              </span>
            </div>
          )}
          <div className="flex justify-between items-center text-sm">
            <span style={{ color: "#8a9a8a" }}>Enrolled</span>
            <span className="font-semibold" style={{ color: "#2d3b2d" }}>
              {new Date(enrollment.enrolledAt).toLocaleDateString("en-US", { timeZone: "America/Denver", month: "long", day: "numeric", year: "numeric" })}
            </span>
          </div>
        </div>
      </div>

      {!summary.isFullyPaid && enrollment.paymentType === "deposit" && (
        <div className="mt-4 p-4 rounded-xl" style={{ background: "#fff8e1", border: "1px solid #ffe082" }}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold" style={{ color: "#f57f17" }}>
                Balance of $397 is due before your first session.
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#8a9a8a" }}>
                Contact Lee Anne if you have any questions.
              </p>
            </div>
            <PayBalanceButton />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Pay Balance Button ────────────────────────────────────────────────────────
function PayBalanceButton() {
  const payBalanceMutation = trpc.payment.payBalance.useMutation({
    onSuccess: (data) => {
      if (data?.url) {
        toast.success("Redirecting to secure checkout...");
        window.open(data.url, '_blank');
      }
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <button
      onClick={() => payBalanceMutation.mutate()}
      disabled={payBalanceMutation.isPending}
      className="flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm whitespace-nowrap transition-all hover:opacity-90"
      style={{ background: "#c9a96e", color: "white" }}
    >
      {payBalanceMutation.isPending ? (
        <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "white" }} />
      ) : (
        <CreditCard size={14} />
      )}
      Pay Balance Now
    </button>
  );
}

// ── Google Calendar Booking Button ────────────────────────────────────────────
const BOOKING_URL = 'https://calendar.google.com/calendar/appointments/schedules/AcZssZ3tlzR8FWHdYzdtXqI43ULRAnOYehFPjpe7uLgjQn9fJ3udHMCJLlIQhahbQ9-_R-GjtY8r6O5k?gv=true';

function GoogleCalendarBookingButton({ sessionNumber }: { sessionNumber: number }) {
  const btnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = btnRef.current;
    if (!el) return;

    const tryLoad = () => {
      const w = window as any;
      if (w.calendar?.schedulingButton?.load) {
        // Clear any previous button
        el.innerHTML = '';
        w.calendar.schedulingButton.load({
          url: BOOKING_URL,
          color: '#c9a96e',
          label: `Book Session ${sessionNumber}`,
          target: el,
        });
      } else {
        // Fallback plain link
        el.innerHTML = `<a href="${BOOKING_URL}" target="_blank" rel="noopener noreferrer"
          style="display:inline-flex;align-items:center;gap:8px;padding:10px 20px;border-radius:9999px;background:#c9a96e;color:white;font-weight:700;font-size:14px;text-decoration:none;">
          <svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'><rect x='3' y='4' width='18' height='18' rx='2' ry='2'/><line x1='16' y1='2' x2='16' y2='6'/><line x1='8' y1='2' x2='8' y2='6'/><line x1='3' y1='10' x2='21' y2='10'/></svg>
          Book Session ${sessionNumber}
        </a>`;
      }
    };

    tryLoad();
    const timer = setTimeout(tryLoad, 1500);
    return () => clearTimeout(timer);
  }, [sessionNumber]);

  return <div ref={btnRef} className="inline-block" />;
}
