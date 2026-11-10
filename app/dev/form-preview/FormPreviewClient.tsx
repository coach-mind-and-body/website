"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { FormTemplateEditor, type EditorState } from "@/components/forms/FormTemplateEditor";
import { FillableForm } from "@/components/forms/FillableForm";
import { FormSubmissionReview } from "@/components/forms/FormSubmissionReview";
import type { FormAnswers, FormField } from "@shared/forms";
import type { ProgramId } from "@shared/programs";

const fields: FormField[] = [
  {
    id: "howto",
    type: "info",
    label: "How to use this calendar",
    help: "",
    required: false,
    options: [],
    rows: [],
    columns: [],
    content: "Mark each day you fast. This is the same wording from the worksheet, kept as something you read.",
    allowExtraRows: false,
  },
  {
    id: "days",
    type: "table",
    label: "Fasting days",
    help: "One row per day.",
    required: true,
    options: [],
    rows: ["Monday", "Tuesday", "Wednesday"],
    columns: ["Fasted", "Notes"],
    content: "",
    allowExtraRows: true,
  },
  {
    id: "protein",
    type: "number",
    label: "Protein goal (grams)",
    help: "",
    required: true,
    options: [],
    rows: [],
    columns: [],
    content: "",
    allowExtraRows: false,
  },
  {
    id: "energy",
    type: "scale",
    label: "Energy today",
    help: "1 is drained, 10 is steady.",
    required: true,
    options: [],
    rows: [],
    columns: [],
    content: "",
    allowExtraRows: false,
  },
  {
    id: "cycle",
    type: "single_choice",
    label: "Which calendar is this?",
    help: "",
    required: true,
    options: ["With cycle", "Without cycle"],
    rows: [],
    columns: [],
    content: "",
    allowExtraRows: false,
  },
  {
    id: "name",
    type: "signature",
    label: "Your name",
    help: "Type your name. That is the signature.",
    required: true,
    options: [],
    rows: [],
    columns: [],
    content: "",
    allowExtraRows: false,
  },
];

const editorSeed: EditorState = {
  title: "Men's fasting calendar",
  instructions: "Fill this on your phone. The original pages stay attached above the questions.",
  kind: "fillable",
  content: "",
  programTags: ["metabolic"] as ProgramId[],
  fields,
};

const filled: FormAnswers = {
  days: { table: [["Yes", "16 hours"], ["", ""], ["Yes", ""]] },
  protein: { number: 120 },
  energy: { scale: 7 },
  cycle: { text: "Without cycle" },
  name: { text: "" },
};

export default function FormPreviewClient() {
  const params = useSearchParams();
  const view = params.get("view") || "editor";
  const [editor, setEditor] = useState(editorSeed);
  const [answers, setAnswers] = useState<FormAnswers>(filled);
  const [reviewed, setReviewed] = useState(false);

  if (view === "fill") {
    return (
      <main className="min-h-screen px-4 py-6" style={{ background: "#faf5f5" }}>
        <div className="mx-auto max-w-lg">
          <p className="text-sm font-bold" style={{ color: "#c9a96e" }}>← Worksheets</p>
          <h1 className="mt-3 text-4xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#2d3b2d" }}>
            Men's fasting calendar
          </h1>
          <p className="mt-2 text-sm font-bold" style={{ color: "#c9a96e" }}>Draft saved</p>
          <p className="mt-4 text-base" style={{ color: "#5a6b5a" }}>{editor.instructions}</p>
          <div className="mt-6">
            <FillableForm
              fields={fields}
              answers={answers}
              onChange={(fieldId, answer) => setAnswers((current) => ({ ...current, [fieldId]: answer }))}
            />
          </div>
          <button type="button" className="mt-8 min-h-14 w-full rounded-full text-base font-bold text-white" style={{ background: "#c9a96e" }}>
            Submit
          </button>
        </div>
      </main>
    );
  }

  if (view === "review") {
    return (
      <main className="min-h-screen px-4 py-6 sm:px-8" style={{ background: "#faf5f5" }}>
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-4 text-3xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#2d3b2d" }}>
            Men's fasting calendar
          </h1>
          <FormSubmissionReview
            submissions={[
              {
                submissionId: 1,
                formId: 1,
                formTitle: "Men's fasting calendar",
                userId: 7,
                clientName: "Alex Morgan",
                clientEmail: "alex@example.com",
                status: reviewed ? "reviewed" : "submitted",
                feedback: reviewed ? "Looks steady. Keep the Wednesday fast." : null,
                submittedAt: "2026-11-10T15:04:00.000Z",
                legacyAnswer: null,
                answers: [
                  { fieldId: "days", label: "Fasting days", type: "table", text: "Monday — Fasted: Yes; Notes: 16 hours\nWednesday — Fasted: Yes; Notes:", photoKey: null },
                  { fieldId: "protein", label: "Protein goal (grams)", type: "number", text: "120", photoKey: null },
                  { fieldId: "energy", label: "Energy today", type: "scale", text: "7", photoKey: null },
                  { fieldId: "cycle", label: "Which calendar is this?", type: "single_choice", text: "Without cycle", photoKey: null },
                  { fieldId: "name", label: "Your name", type: "signature", text: "Alex Morgan", photoKey: null },
                ],
              },
            ]}
            onReview={() => setReviewed(true)}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-8" style={{ background: "#faf5f5" }}>
      <div className="mx-auto max-w-6xl">
        <FormTemplateEditor
          value={editor}
          pages={[{ id: 1, fileName: "mens-fasting-page-1.png", fileUrl: "/logo-new.jpg", mimeType: "image/jpeg" }]}
          publishStatus="draft"
          onChange={setEditor}
          onSave={() => undefined}
          onPublish={() => undefined}
        />
      </div>
    </main>
  );
}
