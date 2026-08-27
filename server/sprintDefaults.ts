export type SprintItem = {
  id: string;
  title: string;
  done: boolean;
  notes: string;
};

export type SprintBoard = {
  period: string;
  items: SprintItem[];
};

export const SPRINT_SETTING_KEY = "sprint_tracker_v1";

export const DEFAULT_SPRINT: SprintBoard = {
  period: "Aug 25 – Sep 24, 2026",
  items: [
    { id: "testflight", title: "Habit Tracker on TestFlight (install on Lee Anne’s iPhone)", done: false, notes: "" },
    { id: "apple99", title: "Apple Developer $99 (required for TestFlight)", done: false, notes: "" },
    { id: "fatsecret", title: "FatSecret food search in the app (free US tier)", done: false, notes: "" },
    { id: "food-noise", title: "Food Noise score in the app (Day 1 vs later)", done: false, notes: "" },
    { id: "reclaim-videos", title: "Remaining RECLAIM retargeting videos uploaded", done: false, notes: "" },
    { id: "fpu-wrap", title: "FPU ads wrap — pull numbers, don’t let spend roll", done: false, notes: "" },
    { id: "review", title: "New review on the site (Marianne)", done: true, notes: "Name added — live after deploy" },
    { id: "logo", title: "Logo updated to Coaching", done: true, notes: "In the repo — live after deploy" },
    { id: "podcast-io", title: "Podcast intros / outros", done: false, notes: "" },
    { id: "podcast-dist", title: "Apple Podcasts + host (Podbean / Descript publish)", done: false, notes: "" },
    { id: "fpu-contacts", title: "Edit FPU sign-up name/email in admin", done: false, notes: "" },
  ],
};
