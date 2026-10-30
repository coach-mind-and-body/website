/**
 * Intro copy for /book and /habit-tracker.
 * Facts only: women over 40, Lee Anne Chapman with coaches Sara and Brittany,
 * virtual Google Meet sessions, Wasatch Front in Utah, and what each page is for.
 * Titles omit the brand because the root layout template appends it.
 */

export const BOOK_PAGE_SEO = {
  title: "Book a Free Discovery Call",
  description:
    "Book a free 30-minute discovery call with Lee Anne Chapman. Virtual coaching for women over 40 on Google Meet, from the Wasatch Front in Utah.",
} as const;

export const BOOK_INTRO = [
  "Mind and Body Reset Coaching is coaching for women over 40. Lee Anne Chapman, a certified life coach and certified health coach, leads the practice with Sara and Brittany, certified Mind and Body Coaches. This page is where you book a free 30-minute discovery call.",
  "Pick a time on the calendar below. Google asks for your name and email so it can send the Google Meet link. After you book, Google emails a confirmation with that link. You can join from a computer, tablet, or phone. Coaching conversations are virtual on Google Meet, and the practice is based on the Wasatch Front in Utah.",
  "The call is a real conversation, not a sales pitch. You can talk through whether coaching is a fit and whether 6 Habits in 6 Weeks is the right next step. Expect no sales pressure, a clearer look at what has been keeping you stuck, and at least one practical insight you can take with you. If you want to look around first, you can meet the coaches on the about page, read the health and wellness blog, or open the free habit tracker.",
] as const;

export const HABIT_TRACKER_PAGE_SEO = {
  title: "Free Daily Habit Tracker",
  description:
    "Free habit tracker for daily check-ins. Use it on this device or sign in to sync. From coaching for women over 40 on the Wasatch Front in Utah.",
} as const;

export const HABIT_TRACKER_INTRO = [
  "The free habit tracker is part of Mind and Body Reset Coaching, the practice Lee Anne Chapman runs with coaches Sara and Brittany for women over 40. Use it to record the daily habits you are practicing. Check off what you did today, write a note for the day, and see the streak of days you have kept going.",
  "You can track on this device without an account. Those entries stay in the browser on this device until you choose otherwise. Sign in if you want the same tracker to sync across your devices, so a check-in on your phone is still there when you open a computer. Today is the daily view. Progress is the longer view of what you have logged.",
  "The tracker is a record you keep, separate from booking a call. A free 30-minute discovery call is on the book page, and coaching sessions are virtual on Google Meet. The practice is based on the Wasatch Front in Utah. Lee Anne Chapman is a certified life coach and certified health coach. Sara and Brittany are certified Mind and Body Coaches. When you are ready, the tracker below is where you mark the day.",
] as const;

export function introWordCount(paragraphs: readonly string[]): number {
  return paragraphs.join(" ").split(/\s+/).filter(Boolean).length;
}
