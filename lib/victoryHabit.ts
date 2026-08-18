/** Pack item that duplicates the dedicated 3-wins card. */
export function isVictoryHabitTitle(title?: string | null): boolean {
  const t = (title ?? "").trim().toLowerCase();
  if (!t) return false;
  return (
    t.includes("3 win") ||
    t.includes("three win") ||
    t.includes("3 victories") ||
    t.includes("victory list") ||
    t === "write 3 wins" ||
    t === "write 3 wins tonight"
  );
}
