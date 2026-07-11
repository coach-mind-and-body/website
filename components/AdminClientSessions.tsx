import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  CheckCircle2,
  Clock,
  Calendar,
  Video,
  PenLine,
  Play,
  Upload,
  FileText,
  Trash2,
  ExternalLink,
  Share2,
  X,
} from "lucide-react";

const SESSION_LABELS = [
  "Discovery & Reset Foundation",
  "Food Noise & Mindset Mapping",
  "Hormones, Hunger & Habits",
  "Movement & Energy Reset",
  "Emotional Eating & Identity",
  "Integration & Your Life Forward",
];

interface Props {
  enrollmentId: number;
  gcalConnected: boolean;
}

export default function AdminClientSessions({ enrollmentId, gcalConnected }: Props) {
  const [schedulingSession, setSchedulingSession] = useState<number | null>(null);
  const [scheduleDateInputs, setScheduleDateInputs] = useState<Record<number, string>>({});
  const [sessionNotes, setSessionNotes] = useState<Record<number, string>>({});
  const [privateNotes, setPrivateNotes] = useState<Record<number, string>>({});
  const [activeNotesTab, setActiveNotesTab] = useState<Record<number, 'shared' | 'private'>>({});
  const [uploading, setUploading] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: sessions, refetch } = trpc.enrollment.adminGetSessions.useQuery(
    { enrollmentId },
    {
      enabled: !!enrollmentId,
      refetchInterval: () =>
        typeof document !== "undefined" && document.hidden ? false : 10_000,
      refetchOnWindowFocus: true,
    }
  );

  const { data: files, refetch: refetchFiles } = trpc.clientFiles.list.useQuery(
    { enrollmentId },
    {
      enabled: !!enrollmentId,
      refetchInterval: () =>
        typeof document !== "undefined" && document.hidden ? false : 10_000,
      refetchOnWindowFocus: true,
    }
  );

  const { data: commonFiles, isLoading: commonLoading } = trpc.clientFiles.listCommon.useQuery(
    undefined,
    { enabled: shareOpen }
  );

  const uploadFile = trpc.clientFiles.upload.useMutation({
    onSuccess: (data) => {
      toast.success(`Uploaded "${data.fileName}"`);
      refetchFiles();
      setUploading(false);
    },
    onError: (e) => {
      toast.error(e.message);
      setUploading(false);
    },
  });

  const shareCommon = trpc.clientFiles.shareCommonToEnrollment.useMutation({
    onSuccess: (data) => {
      if (data.alreadyShared) {
        toast.message(`"${data.fileName}" is already on this client`);
      } else {
        toast.success(`Shared "${data.fileName}" with client`);
      }
      refetchFiles();
      setShareOpen(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteFile = trpc.clientFiles.delete.useMutation({
    onSuccess: () => {
      toast.success("File deleted");
      refetchFiles();
    },
    onError: (e) => toast.error(e.message),
  });

  const scheduleSession = trpc.googleCalendar.scheduleSession.useMutation({
    onSuccess: (data) => {
      if (data.meetLink) {
        toast.success(`Session scheduled! Meet link: ${data.meetLink}`);
      } else if (!data.googleCalendarConnected) {
        toast.success("Session scheduled! (Connect Google Calendar to auto-generate Meet links)");
      } else {
        toast.success("Session scheduled!");
      }
      setSchedulingSession(null);
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const completeSession = trpc.enrollment.completeSession.useMutation({
    onSuccess: () => { toast.success("Session marked complete!"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const updateSession = trpc.enrollment.updateSession.useMutation({
    onSuccess: () => { toast.success("Notes saved!"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const handleSchedule = (session: { id: number; sessionNumber: number }) => {
    const dateStr = scheduleDateInputs[session.sessionNumber];
    if (!dateStr) {
      toast.error("Please select a date and time");
      return;
    }
    const scheduledAt = new Date(dateStr);
    if (isNaN(scheduledAt.getTime())) {
      toast.error("Invalid date");
      return;
    }
    scheduleSession.mutate({ sessionId: session.id, scheduledAt, durationMinutes: 60 });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be under 10 MB");
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      uploadFile.mutate({
        enrollmentId,
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        base64Data: base64,
      });
    };
    reader.onerror = () => {
      toast.error("Failed to read file");
      setUploading(false);
    };
    reader.readAsDataURL(file);
    // Reset the input so the same file can be selected again
    e.target.value = "";
  };

  return (
    <div className="space-y-4 mt-3">
      {/* ── Sessions ── */}
      <div className="space-y-2">
        {Array.from({ length: 6 }, (_, i) => i + 1).map(sessionNum => {
          const session = sessions?.find(s => s.sessionNumber === sessionNum);
          const isCompleted = session?.status === "completed";
          const isScheduled = session?.status === "scheduled";
          const isShowingScheduler = schedulingSession === sessionNum;

          return (
            <div key={sessionNum} className="rounded-lg overflow-hidden" style={{ background: "oklch(0.985 0.008 80)" }}>
              <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{
                      background: isCompleted ? "oklch(0.38 0.10 148)" : isScheduled ? "oklch(0.72 0.12 75)" : "oklch(0.52 0.015 50)",
                      color: isCompleted || isScheduled ? "oklch(1 0 0)" : "oklch(0.72 0.12 75)",
                    }}
                  >
                    {isCompleted ? <CheckCircle2 size={14} /> : isScheduled ? <Clock size={14} /> : sessionNum}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "oklch(0.20 0.015 50)" }}>
                      Session {sessionNum}: {SESSION_LABELS[sessionNum - 1]}
                    </p>
                    {isScheduled && session?.scheduledAt && (
                      <p className="text-xs" style={{ color: "oklch(0.52 0.015 50)" }}>
                        {new Date(session.scheduledAt).toLocaleString()}
                      </p>
                    )}
                    {isCompleted && session?.completedAt && (
                      <p className="text-xs" style={{ color: "oklch(0.52 0.015 50)" }}>
                        Completed {new Date(session.completedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isScheduled && session?.googleMeetLink && (
                    <a
                      href={session.googleMeetLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold"
                      style={{ background: "#1a73e8", color: "white" }}
                    >
                      <Video size={11} /> Join
                    </a>
                  )}
                  {!isCompleted && (
                    <button
                      onClick={() => setSchedulingSession(isShowingScheduler ? null : sessionNum)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold"
                      style={{ background: "oklch(0.52 0.015 50)", color: "oklch(0.72 0.12 75)" }}
                    >
                      <Calendar size={11} /> {isScheduled ? "Reschedule" : "Schedule"}
                    </button>
                  )}
                  {isScheduled && !isCompleted && (
                    <button
                      onClick={() => session && completeSession.mutate({ sessionId: session.id, adminNotes: sessionNotes[sessionNum] })}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold"
                      style={{ background: "oklch(0.38 0.10 148)", color: "white" }}
                    >
                      <Play size={11} /> Complete
                    </button>
                  )}
                </div>
              </div>

              {/* Scheduler panel */}
              {isShowingScheduler && session && (
                <div className="px-3 pb-3 border-t" style={{ borderColor: "oklch(0.90 0.015 80)" }}>
                  <div className="flex items-center gap-2 mt-3">
                    <input
                      type="datetime-local"
                      value={scheduleDateInputs[sessionNum] ?? ""}
                      onChange={e => setScheduleDateInputs(prev => ({ ...prev, [sessionNum]: e.target.value }))}
                      className="text-xs rounded-lg px-2 py-1.5 flex-1"
                      style={{ background: "oklch(1 0 0)", color: "oklch(0.20 0.015 50)", border: "1px solid oklch(0.52 0.015 50)" }}
                    />
                    <button
                      onClick={() => handleSchedule(session)}
                      disabled={scheduleSession.isPending}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold"
                      style={{ background: "oklch(0.72 0.12 75)", color: "oklch(1 0 0)" }}
                    >
                      {scheduleSession.isPending ? "..." : gcalConnected ? <><Video size={11} /> Schedule + Meet</> : <><Calendar size={11} /> Schedule</>}
                    </button>
                  </div>
                  {!gcalConnected && (
                    <p className="text-xs mt-1.5" style={{ color: "oklch(0.52 0.015 50)" }}>
                      Connect Google Calendar in Settings to auto-generate Meet links.
                    </p>
                  )}
                </div>
              )}

              {/* Notes panel — shared vs private tabs */}
              <div className="px-3 pb-3">
                <div className="flex gap-1 mb-2">
                  {(['shared', 'private'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveNotesTab(prev => ({ ...prev, [sessionNum]: tab }))}
                      className="text-xs px-2 py-0.5 rounded-md font-semibold transition-all"
                      style={{
                        background: (activeNotesTab[sessionNum] ?? 'shared') === tab ? 'oklch(0.72 0.12 75)' : 'oklch(0.90 0.015 80)',
                        color: (activeNotesTab[sessionNum] ?? 'shared') === tab ? 'oklch(1 0 0)' : 'oklch(0.52 0.015 50)',
                      }}
                    >
                      {tab === 'shared' ? '👁 Shared with Client' : '🔒 Private Notes'}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  {(activeNotesTab[sessionNum] ?? 'shared') === 'shared' ? (
                    <textarea
                      placeholder="Notes visible to the client..."
                      value={sessionNotes[sessionNum] ?? session?.adminNotes ?? ""}
                      onChange={e => setSessionNotes(prev => ({ ...prev, [sessionNum]: e.target.value }))}
                      className="text-xs rounded-lg px-2 py-1 resize-none flex-1"
                      style={{ background: "oklch(1 0 0)", color: "oklch(0.20 0.015 50)", border: "1px solid oklch(0.52 0.015 50)", height: "52px" }}
                    />
                  ) : (
                    <textarea
                      placeholder="Private notes (only you can see these)..."
                      value={privateNotes[sessionNum] ?? session?.privateNotes ?? ""}
                      onChange={e => setPrivateNotes(prev => ({ ...prev, [sessionNum]: e.target.value }))}
                      className="text-xs rounded-lg px-2 py-1 resize-none flex-1"
                      style={{ background: "oklch(1 0 0)", color: "oklch(0.20 0.015 50)", border: "1px solid oklch(0.55 0.08 30)", height: "52px" }}
                    />
                  )}
                  {session && (
                    <button
                      onClick={() => updateSession.mutate({
                        sessionId: session.id,
                        adminNotes: sessionNotes[sessionNum] ?? session.adminNotes ?? "",
                        privateNotes: privateNotes[sessionNum] ?? session.privateNotes ?? "",
                      })}
                      className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold"
                      style={{ background: "oklch(0.38 0.10 148)", color: "white" }}
                    >
                      <PenLine size={11} /> Save
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Client Files ── */}
      <div className="mt-4">
        <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "oklch(0.52 0.015 50)" }}>
            Client Files
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShareOpen((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
              style={{
                background: shareOpen ? "oklch(0.38 0.10 148)" : "oklch(0.96 0.02 80)",
                color: shareOpen ? "white" : "oklch(0.30 0.02 50)",
                border: shareOpen ? "none" : "1px solid oklch(0.90 0.02 80)",
              }}
            >
              <Share2 size={12} /> Share file
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
              style={{ background: "oklch(0.72 0.12 75)", color: "oklch(1 0 0)" }}
            >
              <Upload size={12} /> {uploading ? "Uploading..." : "Upload File"}
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileUpload}
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp,.txt,.csv,.xlsx,.mp3,.mp4"
          />
        </div>

        {shareOpen && (
          <div
            className="mb-3 rounded-xl p-3 border"
            style={{ background: "oklch(0.99 0.005 80)", borderColor: "oklch(0.90 0.02 80)" }}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold" style={{ color: "oklch(0.30 0.02 50)" }}>
                Shared library — pick a file to put on this client&apos;s portal
              </p>
              <button type="button" onClick={() => setShareOpen(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            </div>
            {commonLoading ? (
              <p className="text-xs text-gray-500">Loading library…</p>
            ) : commonFiles && commonFiles.length > 0 ? (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {commonFiles.map((cf) => (
                  <button
                    key={cf.id}
                    type="button"
                    disabled={shareCommon.isPending}
                    onClick={() =>
                      shareCommon.mutate({ commonFileId: cf.id, enrollmentId })
                    }
                    className="w-full flex items-center justify-between gap-2 p-2.5 rounded-lg text-left text-sm hover:bg-white transition-colors disabled:opacity-60"
                    style={{ border: "1px solid oklch(0.92 0.01 80)" }}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <FileText size={14} className="shrink-0" style={{ color: "oklch(0.72 0.12 75)" }} />
                      <span className="truncate font-medium" style={{ color: "oklch(0.20 0.015 50)" }}>
                        {cf.fileName}
                      </span>
                    </span>
                    <span className="text-xs font-bold shrink-0" style={{ color: "oklch(0.45 0.10 148)" }}>
                      Share →
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs" style={{ color: "oklch(0.52 0.015 50)" }}>
                Library is empty. Go to Admin → <strong>File library</strong> tab and upload common
                worksheets first.
              </p>
            )}
          </div>
        )}

        {files && files.length > 0 ? (
          <div className="space-y-2">
            {files.map(file => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ background: "oklch(0.985 0.008 80)" }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FileText size={16} style={{ color: "oklch(0.72 0.12 75)", flexShrink: 0 }} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "oklch(0.20 0.015 50)" }}>
                      {file.fileName}
                    </p>
                    <p className="text-xs" style={{ color: "oklch(0.52 0.015 50)" }}>
                      {file.uploadedByRole === "admin" ? "Uploaded by coach" : "Uploaded by client"} · {new Date(file.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <a
                    href={file.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg"
                    style={{ color: "oklch(0.72 0.12 75)" }}
                    title="Open file"
                  >
                    <ExternalLink size={14} />
                  </a>
                  <button
                    onClick={() => {
                      if (confirm("Delete this file?")) {
                        deleteFile.mutate({ fileId: file.id });
                      }
                    }}
                    className="p-1.5 rounded-lg"
                    style={{ color: "oklch(0.72 0.07 10)" }}
                    title="Delete file"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs" style={{ color: "oklch(0.52 0.015 50)" }}>
            No files uploaded yet. Upload worksheets, resources, or session materials for this client.
          </p>
        )}
      </div>
    </div>
  );
}
