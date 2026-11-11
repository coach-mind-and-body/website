"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { FormTemplateEditor, type EditorState } from "@/components/forms/FormTemplateEditor";
import { FormSubmissionReview } from "@/components/forms/FormSubmissionReview";
import type { ProgramId } from "@shared/programs";

export default function FormEditorClient() {
  const params = useParams<{ id: string }>();
  const formId = Number(params?.id);
  const [tab, setTab] = useState<"edit" | "submissions">("edit");
  const [state, setState] = useState<EditorState | null>(null);
  const form = trpc.forms.adminGet.useQuery({ formId }, { enabled: Number.isInteger(formId) && formId > 0 });
  const submissions = trpc.forms.adminSubmissions.useQuery({ formId }, { enabled: tab === "submissions" && formId > 0 });
  const save = trpc.forms.adminSave.useMutation({
    onSuccess: () => {
      toast.success("Draft saved");
      form.refetch();
    },
    onError: (error) => toast.error(error.message),
  });
  const publish = trpc.forms.adminPublish.useMutation({
    onSuccess: () => {
      toast.success("Published");
      form.refetch();
    },
    onError: (error) => toast.error(error.message),
  });
  const review = trpc.forms.adminMarkReviewed.useMutation({
    onSuccess: () => {
      toast.success("Marked reviewed");
      submissions.refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  useEffect(() => {
    if (!form.data || state) return;
    setState({
      title: form.data.title,
      instructions: form.data.instructions,
      kind: form.data.kind,
      content: form.data.content,
      programTags: form.data.programTags as ProgramId[],
      fields: form.data.fields,
    });
  }, [form.data, state]);

  if (!Number.isInteger(formId) || formId <= 0) return <p className="p-8">Missing form.</p>;
  if (form.isLoading || !state || !form.data) {
    return <div className="flex min-h-screen items-center justify-center" style={{ background: "#faf5f5" }}>Loading form…</div>;
  }

  const persist = () =>
    save.mutate({
      formId,
      title: state.title,
      instructions: state.instructions,
      kind: state.kind,
      content: state.content,
      programTags: state.programTags,
      fields: state.fields,
    });

  return (
    <main className="min-h-screen px-4 py-6 sm:px-8" style={{ background: "#faf5f5" }}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link href="/admin?tab=filelibrary" className="text-sm font-bold" style={{ color: "#c9a96e" }}>
            ← File library
          </Link>
          <div className="flex gap-2">
            <button type="button" className="min-h-12 rounded-full px-4 text-sm font-bold" style={{ background: tab === "edit" ? "#2d3b2d" : "white", color: tab === "edit" ? "white" : "#2d3b2d" }} onClick={() => setTab("edit")}>
              Edit
            </button>
            <button type="button" className="min-h-12 rounded-full px-4 text-sm font-bold" style={{ background: tab === "submissions" ? "#2d3b2d" : "white", color: tab === "submissions" ? "white" : "#2d3b2d" }} onClick={() => setTab("submissions")}>
              Submissions
            </button>
          </div>
        </div>
        {tab === "edit" ? (
          <FormTemplateEditor
            value={state}
            pages={form.data.pages}
            publishStatus={form.data.publishStatus}
            saving={save.isPending || publish.isPending}
            onChange={setState}
            onSave={persist}
            onPublish={() => {
              save.mutate(
                {
                  formId,
                  title: state.title,
                  instructions: state.instructions,
                  kind: state.kind,
                  content: state.content,
                  programTags: state.programTags,
                  fields: state.fields,
                },
                { onSuccess: () => publish.mutate({ formId }) }
              );
            }}
          />
        ) : (
          <FormSubmissionReview
            submissions={submissions.data ?? []}
            busyId={review.isPending ? review.variables?.submissionId : null}
            onReview={(submissionId, feedback) => review.mutate({ submissionId, feedback })}
          />
        )}
      </div>
    </main>
  );
}
