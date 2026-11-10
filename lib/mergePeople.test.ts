import { describe, expect, it } from "vitest";
import { filterPeople, mergePeople } from "./mergePeople";

const merged = mergePeople({
  contacts: [
    {
      email: "Ava@Example.com",
      name: "Ava Collins",
      phone: "4355550101",
      highestStatus: "reclaim",
      tags: [],
    },
    {
      email: "fran@example.com",
      name: "Fran Doyle",
      highestStatus: "habit-only",
      hasActiveHabits: true,
    },
  ],
  leads: [
    {
      email: "camila@example.com",
      name: "Camila Ortiz",
      phone: "4355550103",
      needsProgram: true,
      status: "new",
    },
  ],
  applicants: [
    {
      id: 4,
      fullName: "Brooke Hale",
      email: "brooke@example.com",
      phone: "4355550102",
      status: "pending",
      whyCoaching: "Evenings are loud.",
      hopes: "A calmer week.",
      flags: ["Mood medication"],
    },
  ],
  intakes: [
    { id: 9, name: "Camila Ortiz", email: "camila@example.com", phone: "4355550103" },
  ],
  snackHacks: [{ id: 3, email: "dana@example.com", firstName: "Dana" }],
  rosters: [
    { program: "reclaim", email: "ava@example.com", name: "Ava Collins" },
    { program: "fpu", email: "elena@example.com", name: "Elena Park" },
    { program: "challenge", email: "gina@example.com", name: "Gina Moss" },
  ],
});

describe("mergePeople", () => {
  it("folds the same email into one person and keeps needs-program first", () => {
    expect(merged.map((person) => person.email)).toEqual([
      "camila@example.com",
      "ava@example.com",
      "brooke@example.com",
      "dana@example.com",
      "elena@example.com",
      "fran@example.com",
      "gina@example.com",
    ]);
    const camila = merged[0];
    expect(camila.needsProgram).toBe(true);
    expect(camila.sources).toEqual(expect.arrayContaining(["contacts", "intakes"]));
    expect(camila.programs).toContain("metabolic");
    expect(camila.intakeId).toBe(9);
  });

  it("tags applicants as metabolic and roster rows as that program", () => {
    const brooke = merged.find((person) => person.email === "brooke@example.com");
    expect(brooke?.sources).toEqual(["applicants"]);
    expect(brooke?.programs).toEqual(["metabolic"]);
    expect(brooke?.applicationFlags).toEqual(["Mood medication"]);
    expect(merged.find((person) => person.email === "elena@example.com")?.programs).toContain("fpu");
    expect(merged.find((person) => person.email === "fran@example.com")?.programs).toContain("habit");
  });

  it("filters by source and program together", () => {
    expect(filterPeople(merged, { source: "snackhack" }).map((person) => person.email)).toEqual([
      "dana@example.com",
    ]);
    expect(filterPeople(merged, { source: "needs" }).map((person) => person.name)).toEqual(["Camila Ortiz"]);
    expect(filterPeople(merged, { program: "fpu" }).map((person) => person.name)).toEqual(["Elena Park"]);
    expect(filterPeople(merged, { source: "applicants", program: "metabolic" })).toHaveLength(1);
    expect(filterPeople(merged, { search: "5550101" }).map((person) => person.name)).toEqual(["Ava Collins"]);
  });
});
