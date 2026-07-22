import { describe, expect, it } from "vitest";
import { resolveComposeRecipientPhone, type ComposeContactHit } from "../../lib/composeRecipient";

describe("resolveComposeRecipientPhone", () => {
  const contact: ComposeContactHit = {
    id: "user-1",
    name: "Jane Doe",
    phone: "(801) 555-1234",
    email: "jane@example.com",
    source: "Customer",
    userId: 1,
  };

  it("prefers selected contact phone", () => {
    expect(resolveComposeRecipientPhone("random", contact)).toBe("(801) 555-1234");
  });

  it("accepts typed phone numbers with 10+ digits", () => {
    expect(resolveComposeRecipientPhone("801-555-9999", null)).toBe("801-555-9999");
    expect(resolveComposeRecipientPhone("(801) 555-9999", null)).toBe("(801) 555-9999");
  });

  it("rejects name-only queries without a selection", () => {
    expect(resolveComposeRecipientPhone("Jane Doe", null)).toBeNull();
  });
});
