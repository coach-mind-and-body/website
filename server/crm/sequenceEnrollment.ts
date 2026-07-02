import { sequenceEnrollments, sequenceSteps, sequences } from "../../drizzle/schema";
import { eq, and, asc, gt, inArray } from "drizzle-orm";

type Db = NonNullable<Awaited<ReturnType<typeof import("../db").getDb>>>;

export async function enrollUserInSequence(
  db: Db,
  userId: number,
  sequenceId: number
): Promise<{ success: boolean; enrollmentId?: number; reEnrolled?: boolean }> {
  const firstStep = await db.query.sequenceSteps.findFirst({
    where: eq(sequenceSteps.sequenceId, sequenceId),
    orderBy: [asc(sequenceSteps.stepOrder)],
  });

  if (!firstStep) {
    throw new Error("This sequence has no steps.");
  }

  const existing = await db.query.sequenceEnrollments.findFirst({
    where: and(
      eq(sequenceEnrollments.userId, userId),
      eq(sequenceEnrollments.sequenceId, sequenceId)
    ),
  });

  const nextTime = new Date();
  nextTime.setHours(nextTime.getHours() + firstStep.delayHours);

  if (existing) {
    if (existing.status === "active") {
      return { success: false, enrollmentId: existing.id };
    }

    await db
      .update(sequenceEnrollments)
      .set({
        status: "active",
        currentStepId: firstStep.id,
        nextExecutionAt: nextTime,
        enrolledAt: new Date(),
      })
      .where(eq(sequenceEnrollments.id, existing.id));

    return { success: true, enrollmentId: existing.id, reEnrolled: true };
  }

  const [result] = await db.insert(sequenceEnrollments).values({
    userId,
    sequenceId,
    currentStepId: firstStep.id,
    nextExecutionAt: nextTime,
    status: "active",
  });

  return { success: true, enrollmentId: result.insertId };
}

/** Cancel active sequence enrollments for a user (e.g. when they reply). */
export async function cancelActiveEnrollmentsForUser(
  db: Db,
  userId: number,
  sequenceNames?: string[]
): Promise<number> {
  const active = await db
    .select({
      enrollmentId: sequenceEnrollments.id,
      sequenceName: sequences.name,
    })
    .from(sequenceEnrollments)
    .innerJoin(sequences, eq(sequenceEnrollments.sequenceId, sequences.id))
    .where(
      and(
        eq(sequenceEnrollments.userId, userId),
        eq(sequenceEnrollments.status, "active")
      )
    );

  const toCancel = sequenceNames
    ? active.filter((e) => sequenceNames.includes(e.sequenceName))
    : active;

  if (toCancel.length === 0) return 0;

  const ids = toCancel.map((e) => e.enrollmentId);
  await db
    .update(sequenceEnrollments)
    .set({ status: "cancelled", currentStepId: null })
    .where(inArray(sequenceEnrollments.id, ids));

  return toCancel.length;
}

export async function hasActiveEnrollmentInSequenceNames(
  db: Db,
  userId: number,
  sequenceNames: string[]
): Promise<boolean> {
  const active = await db
    .select({ sequenceName: sequences.name })
    .from(sequenceEnrollments)
    .innerJoin(sequences, eq(sequenceEnrollments.sequenceId, sequences.id))
    .where(
      and(
        eq(sequenceEnrollments.userId, userId),
        eq(sequenceEnrollments.status, "active")
      )
    );

  return active.some((e) => sequenceNames.includes(e.sequenceName));
}

/** Move enrollment to the next step (or complete) after a step is sent. */
export async function advanceEnrollmentAfterStep(
  db: Db,
  enrollmentId: number,
  currentStepOrder: number,
  sequenceId: number
): Promise<void> {
  const nextStep = await db.query.sequenceSteps.findFirst({
    where: and(
      eq(sequenceSteps.sequenceId, sequenceId),
      gt(sequenceSteps.stepOrder, currentStepOrder)
    ),
    orderBy: [asc(sequenceSteps.stepOrder)],
  });

  if (nextStep) {
    const nextTime = new Date();
    nextTime.setHours(nextTime.getHours() + nextStep.delayHours);
    await db
      .update(sequenceEnrollments)
      .set({
        currentStepId: nextStep.id,
        nextExecutionAt: nextTime,
      })
      .where(eq(sequenceEnrollments.id, enrollmentId));
  } else {
    await db
      .update(sequenceEnrollments)
      .set({ status: "completed", currentStepId: null })
      .where(eq(sequenceEnrollments.id, enrollmentId));
  }
}