import { describe, expect, it } from "vitest";
import {
  extractMetaMessageContent,
  resolveMetaPlatform,
} from "./messageContent";

describe("resolveMetaPlatform", () => {
  it("detects Instagram from messaging_product on page payloads", () => {
    expect(resolveMetaPlatform("page", { messaging_product: "instagram" })).toBe(
      "instagram"
    );
  });

  it("detects Instagram from object type", () => {
    expect(resolveMetaPlatform("instagram", {})).toBe("instagram");
  });

  it("defaults to facebook for messenger", () => {
    expect(resolveMetaPlatform("page", { messaging_product: "messenger" })).toBe(
      "facebook"
    );
  });
});

describe("extractMetaMessageContent", () => {
  it("returns text when present", () => {
    expect(extractMetaMessageContent({ text: "  Hello  " })).toBe("Hello");
  });

  it("labels image attachments", () => {
    expect(extractMetaMessageContent({ attachments: [{ type: "image" }] })).toBe(
      "[Image]"
    );
  });

  it("returns null when empty", () => {
    expect(extractMetaMessageContent({})).toBeNull();
  });
});
