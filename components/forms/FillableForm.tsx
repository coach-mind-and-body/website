"use client";

import type { CSSProperties } from "react";
import type { FormAnswers, FormField } from "@shared/forms";

const fieldClass =
  "min-h-12 w-full rounded-xl border px-3 text-base outline-none focus:ring-2";

function fieldStyle(): CSSProperties {
  return { borderColor: "#f0e8e4", color: "#2d3b2d", background: "white" };
}

export function FillableForm({
  fields,
  answers,
  onChange,
  disabled,
  onPhoto,
}: {
  fields: FormField[];
  answers: FormAnswers;
  onChange: (fieldId: string, answer: FormAnswers[string]) => void;
  disabled?: boolean;
  onPhoto?: (fieldId: string, file: File) => void;
}) {
  return (
    <div className="space-y-6">
      {fields.map((field) => {
        const answer = answers[field.id] ?? {};
        if (field.type === "info") {
          return (
            <div key={field.id} className="rounded-2xl p-4" style={{ background: "#faf5f5" }}>
              <p className="text-base font-semibold" style={{ color: "#2d3b2d" }}>
                {field.label}
              </p>
              {field.content ? (
                <p className="mt-2 whitespace-pre-wrap text-base leading-relaxed" style={{ color: "#5a6b5a" }}>
                  {field.content}
                </p>
              ) : null}
            </div>
          );
        }
        return (
          <label key={field.id} className="block">
            <span className="mb-2 block text-base font-semibold" style={{ color: "#2d3b2d" }}>
              {field.label}
              {field.required ? <span style={{ color: "#c9a96e" }}> *</span> : null}
            </span>
            {field.help ? (
              <span className="mb-2 block text-sm" style={{ color: "#8a9a8a" }}>
                {field.help}
              </span>
            ) : null}
            <FieldControl
              field={field}
              answer={answer}
              disabled={disabled}
              onChange={(next) => onChange(field.id, next)}
              onPhoto={onPhoto}
            />
          </label>
        );
      })}
    </div>
  );
}

function FieldControl({
  field,
  answer,
  disabled,
  onChange,
  onPhoto,
}: {
  field: FormField;
  answer: FormAnswers[string];
  disabled?: boolean;
  onChange: (answer: FormAnswers[string]) => void;
  onPhoto?: (fieldId: string, file: File) => void;
}) {
  if (field.type === "long_text") {
    return (
      <textarea
        className={`${fieldClass} min-h-32 py-3`}
        style={fieldStyle()}
        value={answer.text ?? ""}
        disabled={disabled}
        onChange={(event) => onChange({ text: event.target.value })}
      />
    );
  }
  if (field.type === "number") {
    return (
      <input
        className={fieldClass}
        style={fieldStyle()}
        inputMode="decimal"
        type="number"
        value={answer.number ?? ""}
        disabled={disabled}
        onChange={(event) => onChange({ number: event.target.value === "" ? null : Number(event.target.value) })}
      />
    );
  }
  if (field.type === "date") {
    return (
      <input
        className={fieldClass}
        style={fieldStyle()}
        type="date"
        value={answer.date ?? ""}
        disabled={disabled}
        onChange={(event) => onChange({ date: event.target.value })}
      />
    );
  }
  if (field.type === "single_choice" || field.type === "multi_choice") {
    const selected = new Set(field.type === "multi_choice" ? answer.choices ?? [] : answer.text ? [answer.text] : []);
    return (
      <div className="space-y-2">
        {field.options.map((option) => {
          const on = selected.has(option);
          return (
            <button
              key={option}
              type="button"
              disabled={disabled}
              className="min-h-12 w-full rounded-xl px-4 text-left text-base font-semibold"
              style={{
                background: on ? "#2d3b2d" : "white",
                color: on ? "white" : "#2d3b2d",
                border: "1px solid #f0e8e4",
              }}
              onClick={() => {
                if (field.type === "single_choice") onChange({ text: option });
                else {
                  const next = new Set(selected);
                  if (next.has(option)) next.delete(option);
                  else next.add(option);
                  onChange({ choices: [...next] });
                }
              }}
            >
              {option}
            </button>
          );
        })}
      </div>
    );
  }
  if (field.type === "checkbox") {
    const on = answer.checked === true;
    return (
      <button
        type="button"
        disabled={disabled}
        className="min-h-12 w-full rounded-xl px-4 text-left text-base font-semibold"
        style={{ background: on ? "#fbeee9" : "white", color: "#2d3b2d", border: "1px solid #f0e8e4" }}
        onClick={() => onChange({ checked: !on })}
      >
        {on ? "Checked" : "Tap to check"}
      </button>
    );
  }
  if (field.type === "scale") {
    return (
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: 10 }, (_, index) => index + 1).map((n) => {
          const on = answer.scale === n;
          return (
            <button
              key={n}
              type="button"
              disabled={disabled}
              className="min-h-12 rounded-xl text-lg font-bold"
              style={{ background: on ? "#c9a96e" : "white", color: on ? "white" : "#2d3b2d", border: "1px solid #f0e8e4" }}
              onClick={() => onChange({ scale: n })}
            >
              {n}
            </button>
          );
        })}
      </div>
    );
  }
  if (field.type === "signature") {
    return (
      <input
        className={`${fieldClass} text-lg`}
        style={{ ...fieldStyle(), fontFamily: "'Cormorant Garamond', serif" }}
        autoComplete="name"
        placeholder="Type your full name"
        value={answer.text ?? ""}
        disabled={disabled}
        onChange={(event) => onChange({ text: event.target.value })}
      />
    );
  }
  if (field.type === "photo") {
    return (
      <div className="space-y-2">
        {answer.photoKey ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/form-photo?key=${encodeURIComponent(answer.photoKey)}`}
            alt={field.label}
            className="max-h-64 rounded-xl"
          />
        ) : null}
        <input
          className="block min-h-12 w-full text-base"
          type="file"
          accept="image/*"
          capture="environment"
          disabled={disabled}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onPhoto?.(field.id, file);
            event.target.value = "";
          }}
        />
      </div>
    );
  }
  if (field.type === "table") {
    const columns = field.columns.length ? field.columns : ["Notes"];
    const rowCount = Math.max(field.rows.length, answer.table?.length ?? 0, 1);
    const table = Array.from({ length: rowCount }, (_, rowIndex) =>
      columns.map((_, colIndex) => answer.table?.[rowIndex]?.[colIndex] ?? "")
    );
    const write = (rowIndex: number, colIndex: number, value: string) => {
      const next = table.map((row) => row.slice());
      next[rowIndex][colIndex] = value;
      onChange({ table: next });
    };
    return (
      <div className="space-y-3">
        <div className="space-y-3">
          {table.map((row, rowIndex) => (
            <div key={field.rows[rowIndex] || rowIndex} className="rounded-xl p-3" style={{ background: "#faf5f5" }}>
              <p className="mb-2 text-sm font-semibold" style={{ color: "#2d3b2d" }}>
                {field.rows[rowIndex] || `Row ${rowIndex + 1}`}
              </p>
              {row.map((cell, colIndex) => (
                <label key={colIndex} className="mb-2 block">
                  <span className="mb-1 block text-xs font-semibold" style={{ color: "#8a9a8a" }}>
                    {columns[colIndex]}
                  </span>
                  <input
                    className={fieldClass}
                    style={fieldStyle()}
                    value={cell}
                    disabled={disabled}
                    onChange={(event) => write(rowIndex, colIndex, event.target.value)}
                  />
                </label>
              ))}
            </div>
          ))}
        </div>
        {field.allowExtraRows && !disabled ? (
          <button
            type="button"
            className="min-h-12 rounded-full px-4 text-sm font-bold"
            style={{ background: "#fbeee9", color: "#2d3b2d" }}
            onClick={() => onChange({ table: [...table, columns.map(() => "")] })}
          >
            Add a row
          </button>
        ) : null}
      </div>
    );
  }
  return (
    <input
      className={fieldClass}
      style={fieldStyle()}
      type="text"
      value={answer.text ?? ""}
      disabled={disabled}
      onChange={(event) => onChange({ text: event.target.value })}
    />
  );
}
