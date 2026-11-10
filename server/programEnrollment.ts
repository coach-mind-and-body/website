import crypto from "crypto";
import { format } from "date-fns";
import {
  PROGRAMS,
  sequenceForProgram,
  type ProgramId,
} from "@shared/programs";

export class EnrollmentConflictError extends Error {
  enrollmentId: number;
  constructor(message: string, enrollmentId: number) {
    super(message);
    this.name = "EnrollmentConflictError";
    this.enrollmentId = enrollmentId;
  }
}

export type StoredUser = {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
};

export type EnrollmentStatus = "pending" | "active" | "completed" | "cancelled";

export type StoredEnrollment = {
  id: number;
  userId: number;
  program: ProgramId;
  status: EnrollmentStatus;
  paymentType: "full" | "deposit";
  depositPaid: boolean;
  balancePaid: boolean;
};

export type StoredHolidayApplication = {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  status: "pending" | "accepted";
  enrollmentId: number | null;
};

export interface EnrollmentStore {
  findUserByEmail(email: string): Promise<StoredUser | null>;
  insertUser(row: {
    email: string;
    name: string;
    phone: string | null;
    openId: string;
    passwordResetToken: string;
    passwordResetExpiry: Date;
  }): Promise<StoredUser>;
  updateUser(id: number, patch: { name?: string; phone?: string | null }): Promise<void>;
  findEnrollment(userId: number, program: ProgramId): Promise<StoredEnrollment | null>;
  insertEnrollment(row: {
    userId: number;
    program: ProgramId;
    paymentType: "full" | "deposit";
    depositPaid: boolean;
    balancePaid: boolean;
    status: "active";
  }): Promise<StoredEnrollment>;
  updateEnrollment(
    id: number,
    patch: {
      status: "active";
      paymentType: "full" | "deposit";
      depositPaid: boolean;
      balancePaid: boolean;
    }
  ): Promise<void>;
  sessionCount(enrollmentId: number): Promise<number>;
  insertSessions(
    rows: {
      enrollmentId: number;
      userId: number;
      sessionNumber: number;
      adminNotes: string | null;
    }[]
  ): Promise<void>;
  findUserChallenge(userId: number, challengeId: number): Promise<{ id: number } | null>;
  insertUserChallenge(row: {
    userId: number;
    email: string;
    challengeId: number;
    startDate: string;
  }): Promise<void>;
  findHolidayApplication(id: number): Promise<StoredHolidayApplication | null>;
  markHolidayAccepted(id: number, enrollmentId: number, acceptedAt: Date): Promise<void>;
}

export type EnrollPayment = {
  paymentType: "full" | "deposit";
  depositPaid: boolean;
  balancePaid: boolean;
};

export type EnrollPersonInput = {
  email: string;
  name?: string | null;
  phone?: string | null;
  program: ProgramId;
  payment?: EnrollPayment;
  notes?: string | null;
  challengeId?: number | null;
  challengeThemeTag?: string | null;
};

export type EnrollPersonResult = {
  enrollmentId: number;
  userId: number;
  createdUser: boolean;
  alreadyEnrolled: boolean;
  program: ProgramId;
  programLabel: string;
  clientName: string;
  clientEmail: string;
  resetToken: string | null;
  message: string;
  welcomeEmailSent: boolean;
  sequenceStarted: boolean;
};

type WelcomeParams = {
  clientEmail: string;
  clientName: string;
  resetToken: string;
  program: ProgramId;
  programs?: ProgramId[];
};

type EnrollDeps = {
  sendWelcome: (params: WelcomeParams) => Promise<boolean>;
  startSequence: (email: string, firstName: string | null, sequenceId: string) => Promise<unknown>;
  now?: Date;
  createResetToken?: () => string;
  /** When enrolling several programs, the caller sends one welcome after all of them. */
  skipWelcome?: boolean;
};

function paymentFor(program: ProgramId, payment: EnrollPayment | undefined): EnrollPayment {
  if (program === "reclaim" && payment) return payment;
  return { paymentType: "full", depositPaid: true, balancePaid: true };
}

function displayName(name: string | null | undefined, email: string): string {
  const clean = (name ?? "").replace(/[\r\n]/g, " ").trim();
  if (clean) return clean.slice(0, 200);
  return email.split("@")[0] || email;
}

function firstNameOf(name: string): string {
  return name.split(/\s+/).filter(Boolean)[0] || name;
}

function looksLikePlaceholder(name: string | null, email: string): boolean {
  if (!name) return true;
  return name.trim().toLowerCase() === email.split("@")[0]?.toLowerCase();
}

export function normalizeEnrollmentEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function enrollPerson(
  store: EnrollmentStore,
  input: EnrollPersonInput,
  deps: EnrollDeps
): Promise<EnrollPersonResult> {
  const email = normalizeEnrollmentEmail(input.email);
  const program = input.program;
  const label = PROGRAMS[program].label;
  const payment = paymentFor(program, input.payment);
  const now = deps.now ?? new Date();

  let user = await store.findUserByEmail(email);
  let createdUser = false;
  let resetToken: string | null = null;

  if (!user) {
    resetToken = (deps.createResetToken ?? defaultResetToken)();
    const name = displayName(input.name, email);
    user = await store.insertUser({
      email,
      name,
      phone: input.phone?.trim() || null,
      openId: `email:${email}`.slice(0, 64),
      passwordResetToken: resetToken,
      passwordResetExpiry: new Date(now.getTime() + 24 * 60 * 60 * 1000),
    });
    createdUser = true;
  } else {
    const patch: { name?: string; phone?: string | null } = {};
    if (input.name && looksLikePlaceholder(user.name, email)) {
      patch.name = displayName(input.name, email);
    }
    if (input.phone?.trim() && !user.phone) {
      patch.phone = input.phone.trim();
    }
    if (Object.keys(patch).length > 0) {
      await store.updateUser(user.id, patch);
      user = { ...user, ...patch };
    }
  }

  const clientName = displayName(user.name, email);
  let enrollment = await store.findEnrollment(user.id, program);
  let alreadyEnrolled = false;

  if (enrollment && enrollment.status !== "cancelled") {
    throw new EnrollmentConflictError(
      `${clientName} is already enrolled in ${label}.`,
      enrollment.id
    );
  }

  if (enrollment && enrollment.status === "cancelled") {
    await store.updateEnrollment(enrollment.id, {
      status: "active",
      paymentType: payment.paymentType,
      depositPaid: payment.depositPaid,
      balancePaid: payment.balancePaid,
    });
    enrollment = { ...enrollment, status: "active", ...payment };
  } else {
    enrollment = await store.insertEnrollment({
      userId: user.id,
      program,
      paymentType: payment.paymentType,
      depositPaid: payment.depositPaid,
      balancePaid: payment.balancePaid,
      status: "active",
    });
  }

  const sessionCount = PROGRAMS[program].sessionCount;
  if (sessionCount > 0 && (await store.sessionCount(enrollment.id)) === 0) {
    const note = input.notes?.trim() || null;
    await store.insertSessions(
      Array.from({ length: sessionCount }, (_, index) => ({
        enrollmentId: enrollment!.id,
        userId: user!.id,
        sessionNumber: index + 1,
        adminNotes: note,
      }))
    );
  }

  if (program === "challenge" && input.challengeId) {
    const existingChallenge = await store.findUserChallenge(user.id, input.challengeId);
    if (!existingChallenge) {
      await store.insertUserChallenge({
        userId: user.id,
        email,
        challengeId: input.challengeId,
        startDate: format(now, "yyyy-MM-dd"),
      });
    }
  }

  let welcomeEmailSent = false;
  if (createdUser && resetToken && !deps.skipWelcome) {
    try {
      welcomeEmailSent = await deps.sendWelcome({
        clientEmail: email,
        clientName,
        resetToken,
        program,
        programs: [program],
      });
    } catch (err) {
      console.error("[enroll] Welcome email failed:", err);
    }
  }

  let sequenceStarted = false;
  const sequenceId = sequenceForProgram(program, input.challengeThemeTag);
  if (sequenceId) {
    try {
      const started = await deps.startSequence(email, firstNameOf(clientName), sequenceId);
      sequenceStarted = started !== false;
    } catch (err) {
      console.error("[enroll] Sequence start failed:", err);
    }
  }

  const message = createdUser
    ? `Account created for ${clientName}. They're enrolled in ${label}, and a welcome email is on its way so they can set a password.`
    : `${clientName} is enrolled in ${label}.`;

  return {
    enrollmentId: enrollment.id,
    userId: user.id,
    createdUser,
    alreadyEnrolled,
    program,
    programLabel: label,
    clientName,
    clientEmail: email,
    resetToken,
    message,
    welcomeEmailSent,
    sequenceStarted,
  };
}

function defaultResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function joinLabels(programs: ProgramId[]): string {
  const labels = programs.map((id) => PROGRAMS[id].label);
  if (labels.length <= 1) return labels[0] ?? "that program";
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;
}

export type EnrollManyResult = {
  clientName: string;
  clientEmail: string;
  createdUser: boolean;
  enrolled: { program: ProgramId; enrollmentId: number }[];
  already: { program: ProgramId; enrollmentId: number }[];
  welcomeEmailSent: boolean;
  sequencesStarted: string[];
  message: string;
};

/** Enroll one person in every chosen program. One new account, one welcome email. */
export async function enrollInPrograms(
  store: EnrollmentStore,
  input: Omit<EnrollPersonInput, "program"> & { programs: ProgramId[] },
  deps: EnrollDeps
): Promise<EnrollManyResult> {
  const programs = [...new Set(input.programs)];
  if (programs.length === 0) {
    throw new Error("Pick at least one program.");
  }

  const enrolled: { program: ProgramId; enrollmentId: number }[] = [];
  const already: { program: ProgramId; enrollmentId: number }[] = [];
  const sequencesStarted: string[] = [];
  let createdUser = false;
  let resetToken: string | null = null;
  let clientName = displayName(input.name, normalizeEnrollmentEmail(input.email));
  const email = normalizeEnrollmentEmail(input.email);

  for (const program of programs) {
    try {
      const result = await enrollPerson(
        store,
        { ...input, program },
        { ...deps, skipWelcome: true }
      );
      enrolled.push({ program, enrollmentId: result.enrollmentId });
      clientName = result.clientName;
      if (result.createdUser) {
        createdUser = true;
        resetToken = result.resetToken;
      }
      if (result.sequenceStarted) {
        const sequenceId = sequenceForProgram(program, input.challengeThemeTag);
        if (sequenceId) sequencesStarted.push(sequenceId);
      }
    } catch (err) {
      if (err instanceof EnrollmentConflictError) {
        already.push({ program, enrollmentId: err.enrollmentId });
        continue;
      }
      throw err;
    }
  }

  if (enrolled.length === 0) {
    throw new EnrollmentConflictError(
      `${clientName} is already enrolled in ${joinLabels(already.map((row) => row.program))}.`,
      already[0]?.enrollmentId ?? 0
    );
  }

  let welcomeEmailSent = false;
  if (createdUser && resetToken) {
    try {
      welcomeEmailSent = await deps.sendWelcome({
        clientEmail: email,
        clientName,
        resetToken,
        program: enrolled[0].program,
        programs: enrolled.map((row) => row.program),
      });
    } catch (err) {
      console.error("[enroll] Welcome email failed:", err);
    }
  }

  const enrolledText = joinLabels(enrolled.map((row) => row.program));
  let message = createdUser
    ? `Account created for ${clientName}. They're enrolled in ${enrolledText}, and a welcome email is on its way so they can set a password.`
    : `${clientName} is enrolled in ${enrolledText}.`;
  if (already.length > 0) {
    message += ` Already enrolled in ${joinLabels(already.map((row) => row.program))}.`;
  }
  if (enrolled.some((row) => row.program === "reclaim")) {
    message += " Six coaching sessions are ready in their portal.";
  }

  return {
    clientName,
    clientEmail: email,
    createdUser,
    enrolled,
    already,
    welcomeEmailSent,
    sequencesStarted,
    message,
  };
}

export async function acceptHolidayApplication(
  store: EnrollmentStore,
  applicationId: number,
  deps: EnrollDeps
): Promise<EnrollPersonResult & { alreadyAccepted: boolean }> {
  const application = await store.findHolidayApplication(applicationId);
  if (!application) {
    throw new Error("Application not found");
  }

  if (application.status === "accepted" && application.enrollmentId) {
    return {
      enrollmentId: application.enrollmentId,
      userId: 0,
      createdUser: false,
      alreadyEnrolled: true,
      alreadyAccepted: true,
      program: "metabolic",
      programLabel: PROGRAMS.metabolic.label,
      clientName: application.fullName,
      clientEmail: normalizeEnrollmentEmail(application.email),
      resetToken: null,
      message: `${application.fullName} is already enrolled in Metabolic Coaching.`,
      welcomeEmailSent: false,
      sequenceStarted: false,
    };
  }

  let result: EnrollPersonResult;
  try {
    result = await enrollPerson(
      store,
      {
        email: application.email,
        name: application.fullName,
        phone: application.phone,
        program: "metabolic",
      },
      deps
    );
  } catch (err) {
    if (err instanceof EnrollmentConflictError) {
      await store.markHolidayAccepted(application.id, err.enrollmentId, deps.now ?? new Date());
      return {
        enrollmentId: err.enrollmentId,
        userId: 0,
        createdUser: false,
        alreadyEnrolled: true,
        alreadyAccepted: true,
        program: "metabolic",
        programLabel: PROGRAMS.metabolic.label,
        clientName: application.fullName,
        clientEmail: normalizeEnrollmentEmail(application.email),
        resetToken: null,
        message: err.message,
        welcomeEmailSent: false,
        sequenceStarted: false,
      };
    }
    throw err;
  }

  await store.markHolidayAccepted(application.id, result.enrollmentId, deps.now ?? new Date());
  return { ...result, alreadyAccepted: false };
}
