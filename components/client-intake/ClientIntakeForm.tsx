"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import {
  INTAKE,
  MENOPAUSE_OPTIONS,
  clientIntakeFieldErrors,
  clientIntakeSchema,
  type MenopauseStatus,
} from "@shared/clientIntake";
import { trpc } from "@/lib/trpc";

type Mode = "public" | "portal";

type Fields = {
  name: string;
  phone: string;
  email: string;
  goals: string;
  health1: string;
  health2: string;
  health3: string;
  habitsWorse: string;
  habitsBetter: string;
  activity: string;
  menopause: MenopauseStatus | "";
  lastCycle: string;
  allergies: string;
  companyWebsite: string;
};

const EMPTY: Fields = {
  name: "",
  phone: "",
  email: "",
  goals: "",
  health1: "",
  health2: "",
  health3: "",
  habitsWorse: "",
  habitsBetter: "",
  activity: "",
  menopause: "",
  lastCycle: "",
  allergies: "",
  companyWebsite: "",
};

const fieldClass =
  "mt-2 w-full rounded-xl border px-3 py-3 text-base outline-none focus:ring-2";

const fieldStyle = {
  borderColor: "oklch(0.88 0.02 80)",
  background: "oklch(0.995 0.004 80)",
  color: "oklch(0.22 0.015 50)",
};

export function ClientIntakeForm({ mode, onSaved }: { mode: Mode; onSaved?: () => void }) {
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);

  const submit = trpc.clientIntake.submit.useMutation({
    onSuccess: (result) => {
      if (result.stored) setSent(true);
    },
  });
  const create = trpc.clientIntake.create.useMutation({
    onSuccess: () => {
      setFields(EMPTY);
      setErrors({});
      onSaved?.();
    },
  });

  const pending = submit.isPending || create.isPending;
  const saveError = submit.error?.message || create.error?.message;

  function set<K extends keyof Fields>(key: K, value: Fields[K]) {
    setFields((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = clientIntakeSchema.safeParse({
      ...fields,
      menopause: fields.menopause || undefined,
      lastCycle: fields.lastCycle,
      companyWebsite: fields.companyWebsite,
    });
    if (!parsed.success) {
      const next = clientIntakeFieldErrors(parsed.error);
      setErrors(next);
      const first = parsed.error.issues[0]?.path[0];
      if (first) {
        document.getElementById(`intake-${String(first)}`)?.focus();
      }
      return;
    }
    setErrors({});
    if (mode === "portal") {
      create.mutate(parsed.data);
      return;
    }
    submit.mutate(parsed.data);
  }

  if (sent && mode === "public") {
    return (
      <div className="rounded-2xl px-6 py-10 text-center" style={{ background: "oklch(1 0 0)" }}>
        <h2
          className="text-3xl mb-3"
          style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.20 0.015 50)" }}
        >
          Sent. Lee Anne has your intake.
        </h2>
        <p style={{ color: "oklch(0.42 0.015 50)" }}>You can close this page.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-8">
      <p className="text-sm" style={{ color: "oklch(0.42 0.015 50)" }}>
        Answer every question. If you have no food allergies, write none. The cycle date is only needed if you are
        pre or perimenopausal.
      </p>
      <Field label={INTAKE.name} error={errors.name} htmlFor="intake-name">
        <input
          id="intake-name"
          name="name"
          autoComplete="name"
          value={fields.name}
          onChange={(event) => set("name", event.target.value)}
          className={fieldClass}
          style={fieldStyle}
        />
      </Field>

      <fieldset className="space-y-4">
        <legend className="text-base font-semibold" style={{ color: "oklch(0.20 0.015 50)" }}>
          {INTAKE.contact}
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={INTAKE.phone} error={errors.phone} htmlFor="intake-phone">
            <input
              id="intake-phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              value={fields.phone}
              onChange={(event) => set("phone", event.target.value)}
              className={fieldClass}
              style={fieldStyle}
            />
          </Field>
          <Field label={INTAKE.email} error={errors.email} htmlFor="intake-email">
            <input
              id="intake-email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={fields.email}
              onChange={(event) => set("email", event.target.value)}
              className={fieldClass}
              style={fieldStyle}
            />
          </Field>
        </div>
      </fieldset>

      <Field label={INTAKE.goals} error={errors.goals} htmlFor="intake-goals">
        <textarea
          id="intake-goals"
          name="goals"
          rows={5}
          value={fields.goals}
          onChange={(event) => set("goals", event.target.value)}
          className={fieldClass}
          style={fieldStyle}
        />
      </Field>

      <fieldset>
        <legend className="text-base font-semibold" style={{ color: "oklch(0.20 0.015 50)" }}>
          {INTAKE.health}
        </legend>
        <ol className="mt-3 space-y-3">
          {([1, 2, 3] as const).map((number) => {
            const key = `health${number}` as const;
            return (
              <li key={key} className="flex items-start gap-3">
                <span
                  className="mt-3 w-6 shrink-0 text-lg font-semibold"
                  style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.42 0.015 50)" }}
                >
                  {number}
                </span>
                <div className="min-w-0 flex-1">
                  <label className="sr-only" htmlFor={`intake-${key}`}>
                    {number}
                  </label>
                  <input
                    id={`intake-${key}`}
                    name={key}
                    value={fields[key]}
                    onChange={(event) => set(key, event.target.value)}
                    aria-invalid={errors[key] ? true : undefined}
                    className={fieldClass + " mt-0"}
                    style={fieldStyle}
                  />
                  {errors[key] && <ErrorText>{errors[key]}</ErrorText>}
                </div>
              </li>
            );
          })}
        </ol>
      </fieldset>

      <Field
        label={INTAKE.habitsWorse}
        hint={INTAKE.habitsWorseExamples}
        error={errors.habitsWorse}
        htmlFor="intake-habitsWorse"
      >
        <textarea
          id="intake-habitsWorse"
          name="habitsWorse"
          rows={4}
          value={fields.habitsWorse}
          onChange={(event) => set("habitsWorse", event.target.value)}
          className={fieldClass}
          style={fieldStyle}
        />
      </Field>

      <Field
        label={INTAKE.habitsBetter}
        hint={INTAKE.habitsBetterExamples}
        error={errors.habitsBetter}
        htmlFor="intake-habitsBetter"
      >
        <textarea
          id="intake-habitsBetter"
          name="habitsBetter"
          rows={4}
          value={fields.habitsBetter}
          onChange={(event) => set("habitsBetter", event.target.value)}
          className={fieldClass}
          style={fieldStyle}
        />
      </Field>

      <Field label={INTAKE.activity} hint={INTAKE.activityHint} error={errors.activity} htmlFor="intake-activity">
        <textarea
          id="intake-activity"
          name="activity"
          rows={4}
          value={fields.activity}
          onChange={(event) => set("activity", event.target.value)}
          className={fieldClass}
          style={fieldStyle}
        />
      </Field>

      <fieldset>
        <legend className="text-base font-semibold" style={{ color: "oklch(0.20 0.015 50)" }}>
          {INTAKE.menopause}
        </legend>
        <p className="mt-1 text-sm" style={{ color: "oklch(0.48 0.015 50)" }}>
          {INTAKE.menopauseHint}
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {MENOPAUSE_OPTIONS.map((option) => {
            const selected = fields.menopause === option.value;
            return (
              <label
                key={option.value}
                className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 text-sm font-semibold"
                style={{
                  borderColor: selected ? "oklch(0.72 0.12 75)" : "oklch(0.88 0.02 80)",
                  background: selected ? "oklch(0.97 0.03 85)" : "oklch(1 0 0)",
                  color: "oklch(0.28 0.015 50)",
                }}
              >
                <input
                  id={option.value === "premenopausal" ? "intake-menopause" : undefined}
                  type="radio"
                  name="menopause"
                  value={option.value}
                  checked={selected}
                  onChange={() => set("menopause", option.value)}
                />
                {option.label}
              </label>
            );
          })}
        </div>
        {errors.menopause && <ErrorText>{errors.menopause}</ErrorText>}
      </fieldset>

      <Field label={INTAKE.lastCycle} error={errors.lastCycle} htmlFor="intake-lastCycle">
        <input
          id="intake-lastCycle"
          name="lastCycle"
          type="date"
          value={fields.lastCycle}
          onChange={(event) => set("lastCycle", event.target.value)}
          className={fieldClass + " max-w-xs"}
          style={fieldStyle}
        />
      </Field>

      <Field label={INTAKE.allergies} error={errors.allergies} htmlFor="intake-allergies">
        <textarea
          id="intake-allergies"
          name="allergies"
          rows={3}
          value={fields.allergies}
          onChange={(event) => set("allergies", event.target.value)}
          className={fieldClass}
          style={fieldStyle}
        />
      </Field>

      <div className="h-0 w-0 overflow-hidden opacity-0" aria-hidden="true">
        <label>
          Company website
          <input
            tabIndex={-1}
            autoComplete="off"
            value={fields.companyWebsite}
            onChange={(event) => set("companyWebsite", event.target.value)}
          />
        </label>
      </div>

      {saveError && <p className="text-sm font-semibold" style={{ color: "oklch(0.45 0.14 25)" }}>{saveError}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full px-6 py-3.5 text-base font-bold disabled:opacity-70 sm:w-auto"
        style={{ background: "oklch(0.72 0.12 75)", color: "oklch(1 0 0)" }}
      >
        {pending ? "Saving…" : mode === "portal" ? "Save intake" : "Send this to Lee Anne"}
      </button>
    </form>
  );
}

function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-base font-semibold" style={{ color: "oklch(0.20 0.015 50)" }}>
        {label}
      </label>
      {hint && (
        <p className="mt-1 text-sm" style={{ color: "oklch(0.48 0.015 50)" }}>
          {hint}
        </p>
      )}
      {children}
      {error && <ErrorText>{error}</ErrorText>}
    </div>
  );
}

function ErrorText({ children }: { children: ReactNode }) {
  return (
    <p className="mt-1.5 text-sm" style={{ color: "oklch(0.45 0.14 25)" }}>
      {children}
    </p>
  );
}
