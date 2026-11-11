"use client";

const STATUS_LABEL: Record<string, string> = {
  not_started: "Not started",
  draft: "Draft",
  submitted: "Submitted",
  reviewed: "Reviewed",
};

export type ReviewAnswer = {
  fieldId: string;
  label: string;
  type: string;
  text: string;
  photoKey: string | null;
};

export type ReviewSubmission = {
  submissionId: number;
  formId: number;
  formTitle: string;
  userId: number;
  clientName: string | null;
  clientEmail: string | null;
  status: string;
  feedback: string | null;
  submittedAt: string | null;
  legacyAnswer: string | null;
  answers: ReviewAnswer[];
};

export function FormSubmissionReview({
  submissions,
  busyId,
  onReview,
}: {
  submissions: ReviewSubmission[];
  busyId?: number | null;
  onReview: (submissionId: number, feedback: string) => void;
}) {
  if (submissions.length === 0) {
    return <p className="text-sm" style={{ color: "#8a9a8a" }}>No submissions yet.</p>;
  }
  return (
    <div className="space-y-4">
      {submissions.map((submission) => (
        <article key={submission.submissionId} className="rounded-2xl bg-white p-5" style={{ border: "1px solid #f0e8e4" }}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#2d3b2d" }}>
                {submission.clientName || submission.clientEmail || "Client"}
              </h3>
              <p className="text-sm" style={{ color: "#8a9a8a" }}>
                {submission.formTitle}
                {submission.submittedAt ? ` · ${new Date(submission.submittedAt).toLocaleString()}` : ""}
              </p>
            </div>
            <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: "#fbeee9", color: "#2d3b2d" }}>
              {STATUS_LABEL[submission.status] ?? submission.status}
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {submission.answers.length > 0 ? (
              submission.answers.map((answer) => (
                <div key={answer.fieldId}>
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#c9a96e" }}>{answer.label}</p>
                  {answer.photoKey ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`/api/form-photo?key=${encodeURIComponent(answer.photoKey)}`}
                      alt={answer.label}
                      className="mt-2 max-h-64 rounded-xl"
                    />
                  ) : (
                    <p className="mt-1 whitespace-pre-wrap text-base" style={{ color: "#2d3b2d" }}>{answer.text || "—"}</p>
                  )}
                </div>
              ))
            ) : (
              <p className="whitespace-pre-wrap text-base" style={{ color: "#2d3b2d" }}>{submission.legacyAnswer || "—"}</p>
            )}
          </div>
          {submission.feedback ? (
            <p className="mt-4 text-sm" style={{ color: "#5a6b5a" }}>Feedback: {submission.feedback}</p>
          ) : null}
          {submission.status !== "reviewed" ? (
            <button
              type="button"
              className="mt-4 min-h-12 rounded-full px-5 text-sm font-bold text-white"
              style={{ background: "#2d3b2d" }}
              disabled={busyId === submission.submissionId}
              onClick={() => onReview(submission.submissionId, submission.feedback ?? "")}
            >
              {busyId === submission.submissionId ? "Saving…" : "Mark reviewed"}
            </button>
          ) : (
            <p className="mt-4 text-sm font-semibold" style={{ color: "#2d3b2d" }}>Reviewed</p>
          )}
        </article>
      ))}
    </div>
  );
}
