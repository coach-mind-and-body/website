"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { PROGRAMS, type ProgramId } from "@shared/programs";
import { isShortProgram, programIntakeFieldErrors, programIntakeSchema } from "@shared/programIntake";
import { trpc } from "@/lib/trpc";

const fieldClass = "mt-2 w-full rounded-xl border px-3 py-3 text-base outline-none focus:ring-2";
const fieldStyle = {
  borderColor: "oklch(0.88 0.02 80)",
  background: "oklch(0.995 0.004 80)",
  color: "oklch(0.22 0.015 50)",
};

export function ProgramIntakeForm({ program }: { program: ProgramId }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);

  const questions = trpc.programIntake.questions.useQuery(
    { program },
    { enabled: isShortProgram(program) }
  );
  const submit = trpc.programIntake.submit.useMutation({
    onSuccess: (result) => {
      if (result.stored) setSent(true);
    },
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = programIntakeSchema.safeParse({
      program,
      name,
      email,
      phone,
      companyWebsite,
      answers: Object.entries(answers).map(([questionId, answer]) => ({
        questionId: Number(questionId),
        answer,
      })),
    });
    if (!parsed.success) {
      setErrors(programIntakeFieldErrors(parsed.error));
      return;
    }
    setErrors({});
    submit.mutate(parsed.data);
  }

  if (sent) {
    return (
      <div className="rounded-2xl px-6 py-10 text-center" style={{ background: "oklch(1 0 0)" }}>
        <h2 className="text-3xl mb-3" style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.20 0.015 50)" }}>
          Sent. You&apos;re on the list for {PROGRAMS[program].label}.
        </h2>
        <p style={{ color: "oklch(0.42 0.015 50)" }}>Lee Anne has this. You can close the page.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <Field label="Name" error={errors.name} htmlFor="program-intake-name">
        <input
          id="program-intake-name"
          name="name"
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className={fieldClass}
          style={fieldStyle}
        />
      </Field>
      <Field label="Email" error={errors.email} htmlFor="program-intake-email">
        <input
          id="program-intake-email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={fieldClass}
          style={fieldStyle}
        />
      </Field>
      <Field label="Best phone number" error={errors.phone} htmlFor="program-intake-phone">
        <input
          id="program-intake-phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          className={fieldClass}
          style={fieldStyle}
        />
      </Field>

      {(questions.data ?? []).map((question) => (
        <Field key={question.id} label={question.prompt} htmlFor={`program-intake-q-${question.id}`}>
          <textarea
            id={`program-intake-q-${question.id}`}
            rows={3}
            value={answers[question.id] ?? ""}
            onChange={(event) =>
              setAnswers((current) => ({ ...current, [question.id]: event.target.value }))
            }
            className={fieldClass}
            style={fieldStyle}
          />
        </Field>
      ))}

      <div className="h-0 w-0 overflow-hidden opacity-0" aria-hidden="true">
        <label>
          Company website
          <input
            tabIndex={-1}
            autoComplete="off"
            value={companyWebsite}
            onChange={(event) => setCompanyWebsite(event.target.value)}
          />
        </label>
      </div>

      {submit.error && (
        <p className="text-sm font-semibold" style={{ color: "oklch(0.45 0.14 25)" }}>
          {submit.error.message}
        </p>
      )}

      <button
        type="submit"
        disabled={submit.isPending}
        className="w-full rounded-full px-6 py-3.5 text-base font-bold disabled:opacity-70 sm:w-auto"
        style={{ background: "oklch(0.72 0.12 75)", color: "oklch(1 0 0)" }}
      >
        {submit.isPending ? "Sending…" : "Send this to Lee Anne"}
      </button>
    </form>
  );
}

function Field({
  label,
  error,
  htmlFor,
  children,
}: {
  label: string;
  error?: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-base font-semibold" style={{ color: "oklch(0.20 0.015 50)" }}>
        {label}
      </label>
      {children}
      {error && (
        <p className="mt-1.5 text-sm" style={{ color: "oklch(0.45 0.14 25)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
