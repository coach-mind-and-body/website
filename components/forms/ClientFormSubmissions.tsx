"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { FormSubmissionReview } from "./FormSubmissionReview";
import { toast } from "sonner";

export function ClientFormSubmissions({ userId }: { userId: number }) {
  const submissions = trpc.forms.adminSubmissions.useQuery({ userId });
  const review = trpc.forms.adminMarkReviewed.useMutation({
    onSuccess: () => {
      toast.success("Marked reviewed");
      submissions.refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <div className="border-t pt-6" style={{ borderColor: "oklch(0.90 0.015 80)" }}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "oklch(0.52 0.015 50)" }}>
          Forms
        </p>
        <Link href="/admin?tab=filelibrary" className="text-xs font-bold" style={{ color: "oklch(0.45 0.10 148)" }}>
          File library
        </Link>
      </div>
      {submissions.isLoading ? (
        <p className="text-sm" style={{ color: "oklch(0.52 0.015 50)" }}>Loading forms…</p>
      ) : (
        <FormSubmissionReview
          submissions={submissions.data ?? []}
          busyId={review.isPending ? review.variables?.submissionId : null}
          onReview={(submissionId, feedback) => review.mutate({ submissionId, feedback })}
        />
      )}
    </div>
  );
}
