"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { getLoginUrl } from "@/lib/const";
import { FillableForm } from "@/components/forms/FillableForm";
import { LibraryPager } from "@/components/forms/LibraryPager";
import type { FormAnswers } from "@shared/forms";

export default function FormFillClient() {
  const params = useParams<{ id: string }>();
  const formId = Number(params?.id);
  const { loading, isAuthenticated } = useAuth();
  const detail = trpc.forms.get.useQuery({ formId }, { enabled: isAuthenticated && formId > 0 });
  const saveDraft = trpc.forms.saveDraft.useMutation();
  const submit = trpc.forms.submit.useMutation({
    onSuccess: () => {
      toast.success("Submitted");
      detail.refetch();
    },
    onError: (error) => toast.error(error.message),
  });
  const upload = trpc.forms.uploadPhoto.useMutation({
    onError: (error) => toast.error(error.message),
  });
  const [answers, setAnswers] = useState<FormAnswers>({});
  const [ready, setReady] = useState(false);
  const [note, setNote] = useState("Not started");
  const skipSave = useRef(true);

  useEffect(() => {
    if (!loading && !isAuthenticated) window.location.href = getLoginUrl();
  }, [loading, isAuthenticated]);

  useEffect(() => {
    if (!detail.data) return;
    setAnswers(detail.data.submission?.answers ?? {});
    setNote(
      detail.data.submission?.status === "draft"
        ? "Draft"
        : detail.data.submission?.status === "submitted"
          ? "Submitted"
          : detail.data.submission?.status === "reviewed"
            ? "Reviewed"
            : "Not started"
    );
    skipSave.current = true;
    setReady(true);
  }, [detail.data]);

  useEffect(() => {
    if (!ready || !detail.data || detail.data.form.kind === "handout") return;
    if (detail.data.submission?.status === "reviewed") return;
    if (skipSave.current) {
      skipSave.current = false;
      return;
    }
    setNote("Saving…");
    const timer = window.setTimeout(() => {
      saveDraft.mutate(
        { formId, answers },
        {
          onSuccess: (result) => setNote(result.status === "submitted" ? "Submitted" : "Draft saved"),
          onError: () => setNote("Could not save"),
        }
      );
    }, 800);
    return () => window.clearTimeout(timer);
  }, [answers, ready, formId]);

  if (!detail.data) {
    return <div className="flex min-h-screen items-center justify-center" style={{ background: "#faf5f5" }}>Loading…</div>;
  }

  const locked = detail.data.submission?.status === "reviewed";
  const form = detail.data.form;

  return (
    <main className="min-h-screen px-4 py-6" style={{ background: "#faf5f5" }}>
      <div className="mx-auto max-w-lg">
        <Link href="/portal/forms" className="text-sm font-bold" style={{ color: "#c9a96e" }}>← Worksheets</Link>
        <h1 className="mt-3 text-4xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#2d3b2d" }}>{form.title}</h1>
        <p className="mt-2 text-sm font-bold" style={{ color: "#c9a96e" }}>{note}</p>
        {form.instructions ? <p className="mt-4 whitespace-pre-wrap text-base" style={{ color: "#5a6b5a" }}>{form.instructions}</p> : null}
        {detail.data.pages.length > 0 ? (
          <div className="mt-6">
            <LibraryPager pages={detail.data.pages} title="Original pages" />
          </div>
        ) : null}
        {form.kind === "handout" ? (
          <p className="mt-6 whitespace-pre-wrap text-base leading-relaxed" style={{ color: "#2d3b2d" }}>{form.content}</p>
        ) : null}
        <div className="mt-6">
          <FillableForm
            fields={form.fields}
            answers={answers}
            disabled={locked || upload.isPending}
            onChange={(fieldId, answer) => setAnswers((current) => ({ ...current, [fieldId]: answer }))}
            onPhoto={(fieldId, file) => {
              const reader = new FileReader();
              reader.onload = () => {
                const base64 = String(reader.result).split(",")[1] ?? "";
                upload.mutate(
                  { formId, fieldId, mimeType: file.type || "image/jpeg", base64Data: base64 },
                  { onSuccess: (result) => setAnswers((current) => ({ ...current, [fieldId]: { photoKey: result.key } })) }
                );
              };
              reader.readAsDataURL(file);
            }}
          />
        </div>
        {form.kind !== "handout" && !locked ? (
          <button
            type="button"
            className="mt-8 min-h-14 w-full rounded-full text-base font-bold text-white"
            style={{ background: "#c9a96e" }}
            disabled={submit.isPending}
            onClick={() => submit.mutate({ formId, answers })}
          >
            {submit.isPending ? "Submitting…" : "Submit"}
          </button>
        ) : null}
        {detail.data.submission?.feedback ? (
          <div className="mt-6 rounded-2xl p-4" style={{ background: "white", border: "1px solid #f0e8e4" }}>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#c9a96e" }}>From your coach</p>
            <p className="mt-2 whitespace-pre-wrap text-base" style={{ color: "#2d3b2d" }}>{detail.data.submission.feedback}</p>
          </div>
        ) : null}
      </div>
    </main>
  );
}
