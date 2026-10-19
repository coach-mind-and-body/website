"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import type { ZodError } from "zod";
import {
  HOLIDAY_COPY,
  HOLIDAY_FAQ,
  HOLIDAY_QUESTION_GROUPS,
  holidayApplicationSchema,
  holidayQuestion,
  type HolidayYesNoKey,
  type YesNo,
} from "@shared/holidayCoaching";
import { trpc } from "@/lib/trpc";
import { BRAND } from "@shared/brand";
import { useMetaPixel } from "@/hooks/useMetaPixel";
import { generateMetaEventId, getMetaParams } from "@/hooks/useMetaParams";
import { useGoogleAnalytics } from "@/hooks/useGoogleAnalytics";
import "./holiday.css";

type Answers = Partial<Record<HolidayYesNoKey, YesNo>>;

type Attribution = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  fbclid?: string;
  landingUrl?: string;
};

const STORAGE_KEY = "mbr_holiday_attribution";
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid"] as const;

const FIELD_ORDER = [
  "fullName",
  "email",
  "phone",
  ...HOLIDAY_QUESTION_GROUPS[0].keys,
  "whyCoaching",
  "hopes",
  ...HOLIDAY_QUESTION_GROUPS[1].keys,
];

function readAttribution(): Attribution {
  if (typeof window === "undefined") return {};
  let stored: Attribution = {};
  try {
    stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "{}") as Attribution;
  } catch {
    stored = {};
  }
  const params = new URLSearchParams(window.location.search);
  const map = {
    utm_source: "utmSource",
    utm_medium: "utmMedium",
    utm_campaign: "utmCampaign",
    utm_content: "utmContent",
    utm_term: "utmTerm",
    fbclid: "fbclid",
  } as const;
  const next: Attribution = { ...stored };
  for (const key of UTM_KEYS) {
    const value = params.get(key)?.trim();
    if (value) next[map[key]] = value.slice(0, key === "fbclid" ? 255 : 255);
  }
  if (!next.landingUrl) next.landingUrl = window.location.href.slice(0, 1000);
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* private mode */
  }
  return next;
}

function issuesToErrors(error: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "");
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}

export default function HolidayClient() {
  const { trackLead } = useMetaPixel();
  const ga = useGoogleAnalytics();
  const submit = trpc.leadgen.submitHolidayApplication.useMutation();
  const lock = useRef(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [whyCoaching, setWhyCoaching] = useState("");
  const [hopes, setHopes] = useState("");
  const [answers, setAnswers] = useState<Answers>({});
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    readAttribution();
  }, []);

  useEffect(() => {
    if (!done) return;
    const el = document.getElementById("holiday-thanks");
    el?.focus();
    el?.scrollIntoView({ block: "start" });
  }, [done]);

  function setAnswer(key: HolidayYesNoKey, value: YesNo) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;
    setFormError("");

    const attribution = readAttribution();
    const meta = getMetaParams();
    const eventId = generateMetaEventId();
    const parsed = holidayApplicationSchema.safeParse({
      fullName,
      email,
      phone,
      ...answers,
      whyCoaching,
      hopes,
      ...attribution,
      ...meta,
      eventSourceUrl: typeof window !== "undefined" ? window.location.href.slice(0, 1000) : undefined,
      eventId,
      companyWebsite,
    });

    if (!parsed.success) {
      const next = issuesToErrors(parsed.error);
      setErrors(next);
      const first = FIELD_ORDER.find((key) => next[key]);
      if (first) {
        document.getElementById(`field-${first}`)?.scrollIntoView({ block: "center" });
      }
      return;
    }

    lock.current = true;
    try {
      const result = await submit.mutateAsync(parsed.data);
      if (result.stored) {
        trackLead(
          { content_name: "Holiday Coaching Application", content_category: "Coaching" },
          parsed.data.eventId
        );
        ga.trackLead({ category: "Lead Generation", label: "Holiday Coaching Application" });
      }
      setDone(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setFormError(message);
      document.getElementById("holiday-form-error")?.scrollIntoView({ block: "center" });
    } finally {
      lock.current = false;
    }
  }

  return (
    <div className="hol">
      <header className="hol-header">
        <div className="hol-wrap">
          <Link href="/" className="hol-brand">
            Mind and Body Reset
          </Link>
        </div>
      </header>

      {done ? (
        <main className="hol-wrap hol-thanks">
          <p className="hol-kicker">Application received</p>
          <h1 id="holiday-thanks" tabIndex={-1}>
            {HOLIDAY_COPY.thanks}
          </h1>
          <p className="hol-sign">— {HOLIDAY_COPY.thanksSign}</p>
        </main>
      ) : (
        <main className="hol-wrap">
          <section className="hol-hero">
            <p className="hol-kicker">3 spots · women over 40</p>
            <h1>{HOLIDAY_COPY.headline}</h1>
            <p className="hol-sub">{HOLIDAY_COPY.subhead}</p>
            <p className="hol-offer">{HOLIDAY_COPY.offer}</p>
            <a className="hol-apply" href="#apply">
              {HOLIDAY_COPY.apply}
            </a>
          </section>

          <section className="hol-bio">
            <Image
              src="/photos/lee-anne.jpg"
              alt="Lee Anne Chapman smiling"
              width={1200}
              height={1800}
              priority
              sizes="240px"
              className="hol-photo"
            />
            <p>{HOLIDAY_COPY.bio}</p>
          </section>

          <section className="hol-section">
            <h2>{HOLIDAY_COPY.learnTitle}</h2>
            <p className="hol-intro">{HOLIDAY_COPY.learnIntro}</p>
            <ul className="hol-learn">
              {HOLIDAY_COPY.learn.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="hol-commit">
              <h2>{HOLIDAY_COPY.commitmentTitle}</h2>
              <ul className="hol-learn">
                {HOLIDAY_COPY.commitment.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="hol-keto">
              <strong>{HOLIDAY_COPY.ketoTitle}</strong>
              <p>{HOLIDAY_COPY.ketoBody}</p>
            </div>
          </section>

          <section className="hol-section" id="apply">
            <h2>{HOLIDAY_COPY.formTitle}</h2>
            <p className="hol-intro">{HOLIDAY_COPY.formIntro}</p>
            <form id="holiday-form" className="hol-form-card" onSubmit={onSubmit} noValidate>
              <div className="hol-hp" aria-hidden="true">
                <label htmlFor="companyWebsite">Company website</label>
                <input
                  id="companyWebsite"
                  name="companyWebsite"
                  tabIndex={-1}
                  autoComplete="off"
                  value={companyWebsite}
                  onChange={(event) => setCompanyWebsite(event.target.value)}
                />
              </div>

              {formError ? (
                <p id="holiday-form-error" className="hol-error" role="alert">
                  {formError}
                </p>
              ) : null}

              <label className="hol-label" htmlFor="field-fullName">
                Full name
              </label>
              <input
                id="field-fullName"
                className={errors.fullName ? "hol-input is-bad" : "hol-input"}
                name="name"
                autoComplete="name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                required
              />
              {errors.fullName ? <p className="hol-error">{errors.fullName}</p> : null}

              <label className="hol-label" htmlFor="field-email">
                Email
              </label>
              <input
                id="field-email"
                className={errors.email ? "hol-input is-bad" : "hol-input"}
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
              {errors.email ? <p className="hol-error">{errors.email}</p> : null}

              <label className="hol-label" htmlFor="field-phone">
                Phone
              </label>
              <input
                id="field-phone"
                className={errors.phone ? "hol-input is-bad" : "hol-input"}
                name="tel"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                required
              />
              {errors.phone ? <p className="hol-error">{errors.phone}</p> : null}

              <QuestionGroup
                title={HOLIDAY_QUESTION_GROUPS[0].title}
                intro={HOLIDAY_QUESTION_GROUPS[0].intro}
                keys={HOLIDAY_QUESTION_GROUPS[0].keys}
                answers={answers}
                errors={errors}
                onChange={setAnswer}
              />

              <label className="hol-label" htmlFor="field-whyCoaching">
                Why are you interested in metabolic coaching?
              </label>
              <textarea
                id="field-whyCoaching"
                className={errors.whyCoaching ? "hol-textarea is-bad" : "hol-textarea"}
                value={whyCoaching}
                onChange={(event) => setWhyCoaching(event.target.value)}
                required
              />
              {errors.whyCoaching ? <p className="hol-error">{errors.whyCoaching}</p> : null}

              <label className="hol-label" htmlFor="field-hopes">
                What are your hopes for this coaching?
              </label>
              <textarea
                id="field-hopes"
                className={errors.hopes ? "hol-textarea is-bad" : "hol-textarea"}
                value={hopes}
                onChange={(event) => setHopes(event.target.value)}
                required
              />
              {errors.hopes ? <p className="hol-error">{errors.hopes}</p> : null}

              <QuestionGroup
                title={HOLIDAY_QUESTION_GROUPS[1].title}
                intro={HOLIDAY_QUESTION_GROUPS[1].intro}
                keys={HOLIDAY_QUESTION_GROUPS[1].keys}
                answers={answers}
                errors={errors}
                onChange={setAnswer}
              />

              <p className="hol-privacy">
                {HOLIDAY_COPY.privacy}{" "}
                <Link href="/privacy" target="_blank" rel="noopener noreferrer">
                  Privacy policy
                </Link>
                .
              </p>
              <button className="hol-submit" type="submit" disabled={submit.isPending}>
                {submit.isPending ? "Sending…" : "Submit my application"}
              </button>
            </form>
          </section>

          <section className="hol-section" aria-labelledby="holiday-faq">
            <h2 id="holiday-faq">Questions</h2>
            <ul className="hol-faq">
              {HOLIDAY_FAQ.map((item) => (
                <li key={item.q}>
                  <h3>{item.q}</h3>
                  <p>{item.a}</p>
                </li>
              ))}
            </ul>
            <button
              className="hol-submit hol-submit-late"
              type="submit"
              form="holiday-form"
              disabled={submit.isPending}
            >
              {submit.isPending ? "Sending…" : "Submit my application"}
            </button>
            <p className="hol-fine">{HOLIDAY_COPY.notAPromise}</p>
          </section>

          <noscript>
            <p className="hol-error">
              The form needs JavaScript. Email coach@mindandbodyresetcoach.com and I will send you the questions.
            </p>
          </noscript>
        </main>
      )}

      <footer className="hol-footer">
        <div className="hol-wrap">
          <p>Lee Anne Chapman · Mind and Body Reset Coaching</p>
          <p>
            <Link href="/privacy" target="_blank" rel="noopener noreferrer">
              Privacy
            </Link>
            {" · "}
            <Link href="/disclaimer" target="_blank" rel="noopener noreferrer">
              Disclaimer
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}

function linkAppMentions(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /our app|Mind & Body Reset app/g;
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > last) nodes.push(text.slice(last, index));
    nodes.push(
      <a key={index} href={BRAND.appStoreUrl} target="_blank" rel="noopener noreferrer">
        {match[0]}
      </a>,
    );
    last = index + match[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function QuestionGroup({
  title,
  intro,
  keys,
  answers,
  errors,
  onChange,
}: {
  title: string;
  intro: string;
  keys: readonly HolidayYesNoKey[];
  answers: Answers;
  errors: Record<string, string>;
  onChange: (key: HolidayYesNoKey, value: YesNo) => void;
}) {
  return (
    <div className="hol-group">
      <h3>{title}</h3>
      <p className="hol-intro">{intro}</p>
      {keys.map((key) => {
        const question = holidayQuestion(key);
        const hint = "hint" in question ? question.hint : undefined;
        return (
          <fieldset key={key} className="hol-q" id={`field-${key}`}>
            <legend>{linkAppMentions(question.label)}</legend>
            {hint ? <p className="hol-hint">{linkAppMentions(hint)}</p> : null}
            <div className="hol-choices">
              <button
                type="button"
                className={answers[key] === "yes" ? "hol-choice is-on" : "hol-choice"}
                aria-pressed={answers[key] === "yes"}
                onClick={() => onChange(key, "yes")}
              >
                Yes
              </button>
              <button
                type="button"
                className={answers[key] === "no" ? "hol-choice is-on is-no" : "hol-choice"}
                aria-pressed={answers[key] === "no"}
                onClick={() => onChange(key, "no")}
              >
                No
              </button>
            </div>
            {errors[key] ? <p className="hol-error">{errors[key]}</p> : null}
          </fieldset>
        );
      })}
    </div>
  );
}
