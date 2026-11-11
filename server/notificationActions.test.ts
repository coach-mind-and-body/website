import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { buildApnsBody } from "./apns";
import {
  QUICK_PROTEIN_NAME,
  addedAmount,
  chooseHabitNudge,
  donePatch,
  formAssignedAlert,
  formPushRecipients,
  intakeAlert,
  pickWaterHabit,
  skipPatch,
  walkLogName,
  waterStep,
} from "./notificationCategories";
import { formPushData, intakePushData } from "./notificationPush";

describe("notification action planning", () => {
  const habits = [
    { id: 2, title: "Daily Protein Goal", order: 1 },
    { id: 4, title: "Water", order: 2 },
    { id: 9, title: "Move 10+ minutes", order: 3 },
    { id: 11, title: "Victory list", order: 4 },
  ];

  it("keeps the evening reminder copy and points Mark done at the first open habit", () => {
    const none = chooseHabitNudge({
      eveningOn: true,
      victoryOn: true,
      activeIds: [2, 4, 9, 11],
      completedIds: [],
      hasVictory: false,
      habits,
    });
    expect(none).toMatchObject({
      title: "Quick habit check-in",
      url: "/habit-tracker",
      category: "habit-reminder",
      habitId: 4,
    });

    const partial = chooseHabitNudge({
      eveningOn: true,
      victoryOn: true,
      activeIds: [2, 4, 9],
      completedIds: [4],
      hasVictory: false,
      habits,
    });
    expect(partial?.title).toBe("Almost there");
    expect(partial?.body).toBe("2 habits left today. One more vote for future you.");
    expect(partial?.habitId).toBe(9);

    const victory = chooseHabitNudge({
      eveningOn: true,
      victoryOn: true,
      activeIds: [4, 9],
      completedIds: [4, 9],
      hasVictory: false,
      habits,
    });
    expect(victory).toMatchObject({
      title: "Capture 3 wins",
      url: "/habit-tracker?focus=victories",
      category: "habit-reminder",
    });
    expect(victory?.habitId).toBeUndefined();

    expect(
      chooseHabitNudge({
        eveningOn: true,
        victoryOn: true,
        activeIds: [4],
        completedIds: [4],
        hasVictory: true,
        habits,
      })
    ).toBeNull();
  });

  it("adds 8 ounces, or 1 cup, and marks the habit done at the target", () => {
    expect(waterStep("oz")).toBe(8);
    expect(waterStep(null)).toBe(8);
    expect(waterStep("cups")).toBe(1);
    expect(addedAmount(16, 8, 64)).toEqual({ numericValue: 24, completed: false });
    expect(addedAmount(60, 8, 64)).toEqual({ numericValue: 68, completed: true });
    const water = pickWaterHabit([
      { id: 1, title: "Move", type: "boolean", isActive: true, order: 0 },
      { id: 3, title: "Hydrate", type: "boolean", isActive: true, order: 2 },
      { id: 8, title: "Water", type: "numeric", unit: "oz", isActive: true, order: 1 },
    ]);
    expect(water?.id).toBe(8);
  });

  it("marks a numeric habit done at its target and keeps the number when skipping", () => {
    expect(donePatch({ type: "numeric", targetValue: 64 }, { numericValue: 12 })).toEqual({
      completed: true,
      skipped: false,
      numericValue: 64,
    });
    expect(donePatch({ type: "boolean", targetValue: null }, null)).toEqual({
      completed: true,
      skipped: false,
      numericValue: null,
    });
    expect(skipPatch({ numericValue: 24 })).toEqual({
      completed: false,
      skipped: true,
      numericValue: 24,
    });
  });

  it("names the quick protein snack and the same walk chips the fitness screen uses", () => {
    expect(QUICK_PROTEIN_NAME).toBe("Quick protein");
    expect(walkLogName(10)).toBe("Walk 10m");
    expect(walkLogName(20)).toBe("Walk 20m");
  });

  it("sends a worksheet only to someone who can see it", () => {
    const enrollments = [
      { userId: 1, program: "reclaim", status: "active" },
      { userId: 2, program: "fpu", status: "active" },
      { userId: 3, program: "reclaim", status: "cancelled" },
    ];
    expect(
      formPushRecipients({
        moduleId: null,
        programTags: ["reclaim"],
        listed: true,
        enrollments,
        unlocks: [],
      })
    ).toEqual([1]);
    expect(
      formPushRecipients({
        moduleId: 14,
        programTags: ["reclaim"],
        listed: true,
        enrollments,
        unlocks: [{ userId: 2, moduleId: 14 }],
      })
    ).toEqual([2]);
    expect(
      formPushRecipients({
        moduleId: null,
        programTags: ["reclaim"],
        listed: false,
        enrollments,
        unlocks: [],
      })
    ).toEqual([]);
  });

  it("builds intake and worksheet payloads with the category and ids the app reads", () => {
    expect(intakeAlert("Ava")).toEqual({ title: "New intake", body: "Ava filled out an intake." });
    expect(formAssignedAlert("Evening check-in")).toEqual({
      title: "A worksheet is ready",
      body: "Evening check-in",
    });
    expect(intakePushData()).toMatchObject({
      category: "coach-intake",
      url: "/admin?tab=intakes",
    });
    const body = JSON.parse(
      buildApnsBody(formAssignedAlert("Evening check-in"), formPushData(44))
    );
    expect(body.aps.category).toBe("homework-form");
    expect(body.formId).toBe(44);
    expect(body.aps["mutable-content"]).toBe(1);
    const intake = JSON.parse(buildApnsBody(intakeAlert("Ava"), intakePushData()));
    expect(intake.aps.category).toBe("coach-intake");
    expect(intake.url).toBe("/admin?tab=intakes");
  });

  it("requires a signed-in client for background log actions", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: new Request("https://mindandbodyresetcoach.com/api/trpc"),
    });
    await expect(caller.notificationActions.markHabitDone({})).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    await expect(caller.notificationActions.skipHabit({})).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.notificationActions.addWater({})).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.notificationActions.addProtein({})).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.notificationActions.logWalk({ minutes: 10 })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});
