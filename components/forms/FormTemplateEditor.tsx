"use client";

import { useMemo, useState } from "react";
import { PROGRAM_LIST } from "@shared/programs";
import { blankField, newFieldId, type FieldType, type FormField, type FormKind, type ProgramId } from "@shared/forms";
import { FillableForm } from "./FillableForm";
import { LibraryPager, type LibraryPage } from "./LibraryPager";

const TYPES: { id: FieldType; label: string }[] = [
  { id: "short_text", label: "Short text" },
  { id: "long_text", label: "Long text" },
  { id: "number", label: "Number" },
  { id: "date", label: "Date" },
  { id: "single_choice", label: "Single choice" },
  { id: "multi_choice", label: "Multi choice" },
  { id: "checkbox", label: "Checkbox" },
  { id: "scale", label: "Scale 1–10" },
  { id: "table", label: "Table / log" },
  { id: "signature", label: "Signature" },
  { id: "photo", label: "Photo" },
  { id: "info", label: "Info text" },
];

export type EditorState = {
  title: string;
  instructions: string;
  kind: FormKind;
  content: string;
  programTags: ProgramId[];
  fields: FormField[];
};

export function FormTemplateEditor({
  value,
  pages,
  publishStatus,
  saving,
  onChange,
  onSave,
  onPublish,
}: {
  value: EditorState;
  pages: LibraryPage[];
  publishStatus: "draft" | "published";
  saving?: boolean;
  onChange: (next: EditorState) => void;
  onSave: () => void;
  onPublish: () => void;
}) {
  const [openId, setOpenId] = useState<string | null>(value.fields[0]?.id ?? null);
  const preview = useMemo(() => value.fields, [value.fields]);

  const updateField = (id: string, patch: Partial<FormField>) => {
    onChange({
      ...value,
      fields: value.fields.map((field) => (field.id === id ? { ...field, ...patch } : field)),
    });
  };

  const move = (index: number, direction: -1 | 1) => {
    const next = value.fields.slice();
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    onChange({ ...value, fields: next });
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="space-y-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#c9a96e" }}>
            {publishStatus === "published" ? "Published" : "Draft — clients cannot see this yet"}
          </p>
          <h1 className="mt-1 text-3xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#2d3b2d" }}>
            Review fillable form
          </h1>
          <p className="mt-2 text-sm" style={{ color: "#5a6b5a" }}>
            Check the fields Gemini drafted. The original pages stay attached.
          </p>
        </div>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold" style={{ color: "#2d3b2d" }}>Title</span>
          <input
            className="min-h-12 w-full rounded-xl border px-3 text-base"
            style={{ borderColor: "#f0e8e4" }}
            value={value.title}
            onChange={(event) => onChange({ ...value, title: event.target.value })}
          />
        </label>

        <div>
          <p className="mb-2 text-sm font-semibold" style={{ color: "#2d3b2d" }}>Who can see it</p>
          <div className="flex flex-wrap gap-2">
            {PROGRAM_LIST.map((program) => {
              const on = value.programTags.includes(program.id);
              return (
                <button
                  key={program.id}
                  type="button"
                  className="min-h-12 rounded-full px-4 text-sm font-bold"
                  style={{ background: on ? "#2d3b2d" : "white", color: on ? "white" : "#2d3b2d", border: "1px solid #f0e8e4" }}
                  onClick={() => {
                    const programTags = on
                      ? value.programTags.filter((id) => id !== program.id)
                      : [...value.programTags, program.id];
                    onChange({ ...value, programTags });
                  }}
                >
                  {program.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-2">
          {(["fillable", "handout"] as const).map((kind) => (
            <button
              key={kind}
              type="button"
              className="min-h-12 rounded-full px-4 text-sm font-bold"
              style={{ background: value.kind === kind ? "#c9a96e" : "white", color: value.kind === kind ? "white" : "#2d3b2d", border: "1px solid #f0e8e4" }}
              onClick={() => onChange({ ...value, kind })}
            >
              {kind === "fillable" ? "Fillable form" : "Readable handout"}
            </button>
          ))}
        </div>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold" style={{ color: "#2d3b2d" }}>Instructions</span>
          <textarea
            className="min-h-24 w-full rounded-xl border px-3 py-2 text-base"
            style={{ borderColor: "#f0e8e4" }}
            value={value.instructions}
            onChange={(event) => onChange({ ...value, instructions: event.target.value })}
          />
        </label>

        {value.kind === "handout" ? (
          <label className="block">
            <span className="mb-1 block text-sm font-semibold" style={{ color: "#2d3b2d" }}>Readable content</span>
            <textarea
              className="min-h-40 w-full rounded-xl border px-3 py-2 text-base"
              style={{ borderColor: "#f0e8e4" }}
              value={value.content}
              onChange={(event) => onChange({ ...value, content: event.target.value })}
            />
          </label>
        ) : null}

        <div className="space-y-3">
          {value.fields.map((field, index) => (
            <div key={field.id} className="rounded-2xl bg-white p-4" style={{ border: "1px solid #f0e8e4" }}>
              <button type="button" className="flex min-h-12 w-full items-center justify-between text-left" onClick={() => setOpenId(openId === field.id ? null : field.id)}>
                <span className="font-semibold" style={{ color: "#2d3b2d" }}>
                  {index + 1}. {field.label || "Untitled"}{" "}
                  <span className="text-xs font-bold uppercase" style={{ color: "#c9a96e" }}>{TYPES.find((type) => type.id === field.type)?.label}</span>
                </span>
              </button>
              {openId === field.id ? (
                <div className="mt-3 space-y-3">
                  <select
                    className="min-h-12 w-full rounded-xl border px-3 text-base"
                    style={{ borderColor: "#f0e8e4" }}
                    value={field.type}
                    onChange={(event) => {
                      const next = blankField(event.target.value as FieldType);
                      updateField(field.id, {
                        type: next.type,
                        options: next.options,
                        rows: next.rows,
                        columns: next.columns,
                        content: next.content,
                        allowExtraRows: next.allowExtraRows,
                        required: false,
                      });
                    }}
                  >
                    {TYPES.map((type) => (
                      <option key={type.id} value={type.id}>{type.label}</option>
                    ))}
                  </select>
                  <input
                    className="min-h-12 w-full rounded-xl border px-3 text-base"
                    style={{ borderColor: "#f0e8e4" }}
                    placeholder="Label"
                    value={field.label}
                    onChange={(event) => updateField(field.id, { label: event.target.value })}
                  />
                  {field.type === "info" ? (
                    <textarea
                      className="min-h-28 w-full rounded-xl border px-3 py-2 text-base"
                      style={{ borderColor: "#f0e8e4" }}
                      placeholder="Text the client reads"
                      value={field.content}
                      onChange={(event) => updateField(field.id, { content: event.target.value })}
                    />
                  ) : (
                    <input
                      className="min-h-12 w-full rounded-xl border px-3 text-base"
                      style={{ borderColor: "#f0e8e4" }}
                      placeholder="Help text (optional)"
                      value={field.help}
                      onChange={(event) => updateField(field.id, { help: event.target.value })}
                    />
                  )}
                  {(field.type === "single_choice" || field.type === "multi_choice") && (
                    <textarea
                      className="min-h-24 w-full rounded-xl border px-3 py-2 text-base"
                      style={{ borderColor: "#f0e8e4" }}
                      placeholder="One option per line"
                      value={field.options.join("\n")}
                      onChange={(event) => updateField(field.id, { options: event.target.value.split("\n").map((line) => line.trim()).filter(Boolean) })}
                    />
                  )}
                  {field.type === "table" && (
                    <>
                      <textarea
                        className="min-h-24 w-full rounded-xl border px-3 py-2 text-base"
                        style={{ borderColor: "#f0e8e4" }}
                        placeholder="Row labels, one per line"
                        value={field.rows.join("\n")}
                        onChange={(event) => updateField(field.id, { rows: event.target.value.split("\n").map((line) => line.trim()).filter(Boolean) })}
                      />
                      <textarea
                        className="min-h-20 w-full rounded-xl border px-3 py-2 text-base"
                        style={{ borderColor: "#f0e8e4" }}
                        placeholder="Column labels, one per line"
                        value={field.columns.join("\n")}
                        onChange={(event) => updateField(field.id, { columns: event.target.value.split("\n").map((line) => line.trim()).filter(Boolean) })}
                      />
                    </>
                  )}
                  {field.type !== "info" ? (
                    <label className="flex min-h-12 items-center gap-2 text-sm font-semibold" style={{ color: "#2d3b2d" }}>
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(event) => updateField(field.id, { required: event.target.checked })}
                      />
                      Required
                    </label>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="min-h-12 rounded-full px-4 text-sm font-bold" style={{ background: "#f5f5f5" }} onClick={() => move(index, -1)}>Move up</button>
                    <button type="button" className="min-h-12 rounded-full px-4 text-sm font-bold" style={{ background: "#f5f5f5" }} onClick={() => move(index, 1)}>Move down</button>
                    <button
                      type="button"
                      className="min-h-12 rounded-full px-4 text-sm font-bold"
                      style={{ color: "#8a3a3a" }}
                      onClick={() => onChange({ ...value, fields: value.fields.filter((item) => item.id !== field.id) })}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ))}
          <button
            type="button"
            className="min-h-12 rounded-full px-4 text-sm font-bold"
            style={{ background: "#fbeee9", color: "#2d3b2d" }}
            onClick={() => {
              const field = { ...blankField("short_text"), id: newFieldId() };
              onChange({ ...value, fields: [...value.fields, field] });
              setOpenId(field.id);
            }}
          >
            Add field
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={saving} className="min-h-12 rounded-full px-5 text-sm font-bold" style={{ background: "#fbeee9", color: "#2d3b2d" }} onClick={onSave}>
            {saving ? "Saving…" : "Save draft"}
          </button>
          <button type="button" disabled={saving} className="min-h-12 rounded-full px-5 text-sm font-bold text-white" style={{ background: "#2d3b2d" }} onClick={onPublish}>
            Publish
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {pages.length > 0 ? <LibraryPager pages={pages} title="Original pages" /> : null}
        <div className="rounded-2xl bg-white p-4" style={{ border: "1px solid #f0e8e4" }}>
          <h2 className="mb-4 text-xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#2d3b2d" }}>
            Client preview
          </h2>
          {value.instructions ? <p className="mb-4 whitespace-pre-wrap text-base" style={{ color: "#5a6b5a" }}>{value.instructions}</p> : null}
          {value.kind === "handout" ? <p className="mb-4 whitespace-pre-wrap text-base" style={{ color: "#2d3b2d" }}>{value.content}</p> : null}
          <FillableForm fields={preview} answers={{}} onChange={() => undefined} disabled />
        </div>
      </div>
    </div>
  );
}
