import { describe, expect, it } from "vitest";
import { firstNameFromDisplayName, parseContactPaste } from "./parseContactPaste";

describe("parseContactPaste", () => {
  it("parses Name <email> lines", () => {
    const { contacts } = parseContactPaste(
      "Sarah Johnson <sarah@example.com>\nMia Lee <mia@test.org>"
    );
    expect(contacts).toEqual([
      { email: "sarah@example.com", firstName: "Sarah", rawLine: expect.any(String) },
      { email: "mia@test.org", firstName: "Mia", rawLine: expect.any(String) },
    ]);
  });

  it("parses CSV-ish name,email", () => {
    const { contacts } = parseContactPaste(
      "Name,Email\nJane Doe,jane@x.com\nSmith, Bob,bob@y.com"
    );
    expect(contacts.map((c) => c.email)).toEqual(["jane@x.com", "bob@y.com"]);
    expect(contacts[0].firstName).toBe("Jane");
    // "Smith, Bob" → Last, First
    expect(contacts[1].firstName).toBe("Bob");
  });

  it("parses Dave-Ramsey-ish messy block", () => {
    const paste = `
Member Name	Email	Phone
Sarah Johnson	sarah.j@gmail.com	(555) 111-2222
Lee, Anne	leeanne@example.com	
mia.park@yahoo.com
`;
    const { contacts } = parseContactPaste(paste);
    expect(contacts.map((c) => c.email)).toEqual([
      "sarah.j@gmail.com",
      "leeanne@example.com",
      "mia.park@yahoo.com",
    ]);
    expect(contacts[0].firstName).toBe("Sarah");
    expect(contacts[1].firstName).toBe("Anne");
    expect(contacts[2].firstName).toBe("Mia");
  });

  it("parses tab-separated Excel paste", () => {
    const { contacts } = parseContactPaste("Amy Pond\tamy@tardis.com\t555-1234");
    expect(contacts[0]).toMatchObject({ email: "amy@tardis.com", firstName: "Amy" });
  });

  it("parses email-only lines with local-part first name", () => {
    const { contacts } = parseContactPaste("carter.smith@gmail.com");
    expect(contacts[0].email).toBe("carter.smith@gmail.com");
    expect(contacts[0].firstName).toBe("Carter");
  });

  it("dedupes emails case-insensitively", () => {
    const { contacts, duplicateEmails } = parseContactPaste(
      "A a@x.com\nB A@X.COM"
    );
    expect(contacts).toHaveLength(1);
    expect(duplicateEmails).toBe(1);
  });

  it("handles Last, First format", () => {
    expect(firstNameFromDisplayName("Doe, Jane")).toBe("Jane");
  });
});
