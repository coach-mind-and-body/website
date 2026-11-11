"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { PROGRAMS, type ProgramId } from "@shared/programs";
import { coachFoodLogPhotoSrc } from "@/lib/foodLogPhoto";

const ink = "oklch(0.20 0.015 50)";
const muted = "oklch(0.52 0.015 50)";
const gold = "oklch(0.72 0.12 75)";
const line = "oklch(0.90 0.015 80)";

function isImage(mimeType: string | null | undefined, name: string) {
  if (mimeType?.startsWith("image/")) return true;
  return /\.(png|jpe?g|gif|webp|heic)$/i.test(name);
}

export function AdminClientWorkspace({ userId, email }: { userId?: number; email?: string }) {
  const utils = trpc.useUtils();
  const query = trpc.reclaimHub.adminClientWorkspace.useQuery(
    { userId, email },
    { enabled: Boolean(userId || email) }
  );
  const [feedback, setFeedback] = useState<Record<number, string>>({});

  const refresh = () => {
    if (userId || email) utils.reclaimHub.adminClientWorkspace.invalidate({ userId, email });
    if (userId) utils.reclaimHub.adminGetClientProgress.invalidate({ userId });
  };

  const sendFeedback = trpc.reclaimHub.adminUpdateFeedback.useMutation({
    onSuccess: (result) => {
      toast.success(result.emailSent ? "Feedback saved and emailed." : "Feedback saved. The email did not go out.");
      refresh();
    },
    onError: (error) => toast.error(error.message),
  });
  const assignModule = trpc.reclaimHub.adminAssignModule.useMutation({
    onSuccess: () => {
      toast.success("Module unlocked.");
      refresh();
    },
    onError: (error) => toast.error(error.message),
  });
  const unassignModule = trpc.reclaimHub.adminUnassignModule.useMutation({
    onSuccess: () => {
      toast.success("Module locked again.");
      refresh();
    },
    onError: (error) => toast.error(error.message),
  });

  if (query.error) {
    return <p className="text-sm" style={{ color: muted }}>{query.error.message}</p>;
  }
  if (query.isLoading) {
    return <p className="text-sm" style={{ color: muted }}>Loading their program…</p>;
  }
  const data = query.data;
  if (!data?.found) {
    return (
      <section className="rounded-xl p-4" style={{ background: "white", border: `1px solid ${line}` }}>
        <h3 className="font-bold text-lg" style={{ fontFamily: "'Cormorant Garamond', serif", color: ink }}>
          Their program
        </h3>
        <p className="text-sm mt-1" style={{ color: muted }}>
          No account yet. Enroll them and their modules, answers, files, and food logs will show here.
        </p>
      </section>
    );
  }

  const programs = data.programs;
  const enrolled = new Set(programs.map((row) => row.program));
  const modulesByProgram = new Map<ProgramId, typeof data.modules>();
  for (const mod of data.modules) {
    const list = modulesByProgram.get(mod.program) ?? [];
    list.push(mod);
    modulesByProgram.set(mod.program, list);
  }

  return (
    <section className="rounded-xl p-4 sm:p-5 space-y-6" style={{ background: "white", border: `1px solid ${line}` }}>
      <div>
        <h3 className="font-bold text-xl" style={{ fontFamily: "'Cormorant Garamond', serif", color: ink }}>
          Their program
        </h3>
        <p className="text-sm mt-1" style={{ color: muted }}>
          {data.user.name || data.user.email} · programs, answers, files, and food logs in one place.
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          {programs.length === 0 && (
            <span className="text-xs" style={{ color: muted }}>Not enrolled in a program yet.</span>
          )}
          {programs.map((row) => (
            <span
              key={row.enrollmentId}
              className="text-xs font-bold px-3 py-1 rounded-full"
              style={{ background: "oklch(0.96 0.025 50)", color: ink }}
            >
              {row.label} · {row.status}
            </span>
          ))}
        </div>
      </div>

      {programs.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: muted }}>Modules</p>
          <div className="space-y-3">
            {[...enrolled].map((program) => (
              <div key={program}>
                <p className="text-sm font-semibold mb-1" style={{ color: ink }}>{PROGRAMS[program].label}</p>
                <div className="flex flex-wrap gap-2">
                  {(modulesByProgram.get(program) ?? []).map((mod) => (
                    <button
                      key={mod.id}
                      type="button"
                      disabled={assignModule.isPending || unassignModule.isPending}
                      onClick={() => {
                        if (!data.user.id) return;
                        if (mod.unlocked) {
                          unassignModule.mutate({ userId: data.user.id, moduleId: mod.id });
                        } else {
                          assignModule.mutate({ userId: data.user.id, moduleId: mod.id });
                        }
                      }}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                      style={{
                        background: mod.unlocked ? "oklch(0.93 0.04 148)" : "oklch(0.97 0.01 80)",
                        color: ink,
                        border: `1px solid ${line}`,
                      }}
                    >
                      {mod.order}. {mod.title}
                      {mod.isPublished ? "" : " (draft)"}
                      {mod.unlocked ? " · open" : " · locked"}
                    </button>
                  ))}
                  {(modulesByProgram.get(program) ?? []).length === 0 && (
                    <p className="text-xs" style={{ color: muted }}>No modules built for this program yet.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: muted }}>Assignment answers</p>
        {data.submissions.length === 0 ? (
          <p className="text-sm" style={{ color: muted }}>No answers yet.</p>
        ) : (
          <div className="space-y-3">
            {data.submissions.map((item) => {
              const draft = feedback[item.id] !== undefined ? feedback[item.id] : item.feedback || "";
              return (
                <div key={item.id} className="rounded-lg p-3" style={{ background: "oklch(0.985 0.008 80)" }}>
                  <p className="text-xs font-bold" style={{ color: gold }}>
                    {item.programLabel} · {item.moduleTitle}
                  </p>
                  <p className="text-sm mt-1" style={{ color: ink }}>{item.question}</p>
                  <p className="text-sm mt-2 whitespace-pre-wrap" style={{ color: ink }}>
                    {item.answer || (item.fileUrl ? "File only." : "—")}
                  </p>
                  {item.fileUrl && (
                    <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-bold underline" style={{ color: gold }}>
                      Open their file
                    </a>
                  )}
                  <textarea
                    value={draft}
                    onChange={(event) => setFeedback((prev) => ({ ...prev, [item.id]: event.target.value }))}
                    placeholder="A note they will see, and receive by email."
                    className="w-full mt-2 text-sm rounded-lg p-2"
                    style={{ background: "white", border: `1px solid ${line}`, color: ink }}
                    rows={3}
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      type="button"
                      disabled={sendFeedback.isPending || !draft.trim()}
                      onClick={() => sendFeedback.mutate({ submissionId: item.id, feedback: draft })}
                      className="text-xs font-bold px-3 py-1.5 rounded-full disabled:opacity-50"
                      style={{ background: gold, color: "white" }}
                    >
                      Save & Send Feedback
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: muted }}>Files and photos</p>
        {data.files.length === 0 ? (
          <p className="text-sm" style={{ color: muted }}>Nothing uploaded yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-2">
            {data.files.map((file) => (
              <a
                key={file.id}
                href={file.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg p-2"
                style={{ background: "oklch(0.985 0.008 80)" }}
              >
                {isImage(file.mimeType, file.fileName) ? (
                  <img src={file.fileUrl} alt="" className="w-12 h-12 rounded-md object-cover" />
                ) : (
                  <span className="w-12 h-12 rounded-md flex items-center justify-center text-[10px] font-bold" style={{ background: "white", color: gold }}>
                    File
                  </span>
                )}
                <span className="min-w-0">
                  <span className="block text-sm font-semibold truncate" style={{ color: ink }}>{file.fileName}</span>
                  <span className="block text-[11px]" style={{ color: muted }}>
                    {file.program ? PROGRAMS[file.program].label : "Program"} · {file.uploadedByRole === "admin" ? "From you" : "From them"}
                  </span>
                </span>
              </a>
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: muted }}>Food logs</p>
        {!data.foodLogAccess.allowed ? (
          <p className="text-sm" style={{ color: muted }}>
            Hidden. They have not shared habits, and they are not in a program.
          </p>
        ) : (
          <>
            {data.foodLogAccess.reason === "enrolled" && !data.user.shareHabitsWithCoach && (
              <p className="text-xs mb-2" style={{ color: muted }}>
                Visible because they are in a program. Habit sharing is still off.
              </p>
            )}
            {data.foodLogs.length === 0 ? (
              <p className="text-sm" style={{ color: muted }}>No food logged yet.</p>
            ) : (
              <div className="space-y-2">
                {data.foodLogs.map((log) => {
                  const photoSrc = coachFoodLogPhotoSrc(log.imageUrl);
                  return (
                  <div key={log.id} className="flex items-center gap-3 rounded-lg p-2" style={{ background: "oklch(0.985 0.008 80)" }}>
                    {photoSrc ? (
                      <a href={photoSrc} target="_blank" rel="noopener noreferrer">
                        <img src={photoSrc} alt="" className="w-14 h-14 rounded-md object-cover" />
                      </a>
                    ) : (
                      <span className="w-14 h-14 rounded-md" style={{ background: "white" }} />
                    )}
                    <div>
                      <p className="text-sm font-semibold" style={{ color: ink }}>{log.foodName}</p>
                      <p className="text-xs" style={{ color: muted }}>
                        {log.dateStr} · {log.mealType} · {log.calories} cal
                        {photoSrc ? " · scanned page or meal photo" : ""}
                      </p>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
