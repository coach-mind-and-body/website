import { describe, expect, it } from "vitest";
import { applyRosterAddition, applyRosterEmails } from "./additions";
import type { DbData } from "./store";

function data(names: string[] = []): DbData {
  return {
    members: names.map((name, i) => ({
      id: i + 1,
      name,
      email: null,
      phone: null,
      token: `t${i}`,
      active: true,
      createdAt: "2026-10-01T00:00:00.000Z",
    })),
    weeks: [],
    rsvps: [],
    nextId: { members: names.length + 1, weeks: 1, rsvps: 1 },
  };
}

describe("applyRosterAddition", () => {
  it("adds a missing person once", () => {
    const roster = data(["Amy"]);
    applyRosterAddition(roster, "Kacy", "2026-10-16T00:00:00.000Z");
    applyRosterAddition(roster, "Kacy", "2026-10-16T00:00:00.000Z");
    expect(roster.members.map((m) => m.name)).toEqual(["Amy", "Kacy"]);
    expect(roster.members[1]).toMatchObject({
      id: 2,
      active: true,
      email: null,
      phone: null,
      createdAt: "2026-10-16T00:00:00.000Z",
    });
    expect(roster.nextId.members).toBe(3);
    expect(roster.appliedAdditions).toEqual(["kacy"]);
  });

  it("records a person who is already on the list and does not put them back after removal", () => {
    const roster = data(["Kacy"]);
    applyRosterAddition(roster, " kacy ", "2026-10-16T00:00:00.000Z");
    expect(roster.members).toHaveLength(1);
    roster.members = [];
    applyRosterAddition(roster, "Kacy", "2026-10-16T00:00:00.000Z");
    expect(roster.members).toHaveLength(0);
  });

  it("saves Lee Anne's addresses once and leaves off the people she skipped", () => {
    const roster = data(["Amy", "Kelly F.", "Lee Anne", "Mckenna", "Kacy"]);
    roster.members[2].email = "leeanne@connectbsg.com";
    applyRosterEmails(roster);
    applyRosterEmails(roster);
    expect(roster.members.find((m) => m.name === "Amy")?.email).toBeNull();
    expect(roster.members.find((m) => m.name === "Kelly F.")?.email).toBe("frasierk13@gmail.com");
    expect(roster.members.find((m) => m.name === "Lee Anne")?.email).toBe("connect.chapman@gmail.com");
    expect(roster.members.find((m) => m.name === "Mckenna")?.email).toBe("mckennaosborne@gmail.com");
    expect(roster.members.find((m) => m.name === "Kacy")?.email).toBe("kacy.moller@hotmail.com");

    const lee = roster.members.find((m) => m.name === "Lee Anne");
    if (lee) lee.email = "edited@example.com";
    applyRosterEmails(roster);
    expect(lee?.email).toBe("edited@example.com");
  });
});
