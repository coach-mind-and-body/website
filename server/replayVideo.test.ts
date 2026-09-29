import { describe, expect, it } from "vitest";
import {
  parseReplayToken,
  parseReplayUrl,
  replayEmbedUrl,
  replayToken,
  replayWatchUrl,
} from "@shared/replayVideo";

describe("parseReplayUrl", () => {
  it("accepts YouTube watch and short links", () => {
    expect(parseReplayUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toEqual({
      ok: true,
      source: { kind: "youtube", id: "dQw4w9WgXcQ" },
    });
    expect(parseReplayUrl("https://youtu.be/dQw4w9WgXcQ")).toEqual({
      ok: true,
      source: { kind: "youtube", id: "dQw4w9WgXcQ" },
    });
  });

  it("accepts Drive file links including resource keys", () => {
    const id = "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms";
    expect(parseReplayUrl(`https://drive.google.com/file/d/${id}/view?usp=sharing`)).toEqual({
      ok: true,
      source: { kind: "drive", id },
    });
    expect(parseReplayUrl(`https://drive.google.com/open?id=${id}`)).toEqual({
      ok: true,
      source: { kind: "drive", id },
    });
    expect(
      parseReplayUrl(`https://drive.google.com/file/d/${id}/view?resourcekey=0-abcDEF`)
    ).toEqual({
      ok: true,
      source: { kind: "drive", id, resourceKey: "0-abcDEF" },
    });
  });

  it("rejects the live Meet room and Drive folders", () => {
    expect(parseReplayUrl("https://meet.google.com/ppv-kose-wyj")).toEqual({
      ok: false,
      error: "meet_live",
    });
    expect(parseReplayUrl("https://drive.google.com/drive/folders/abc123xyz789ABCDEFGH")).toEqual({
      ok: false,
      error: "drive_folder",
    });
  });
});

describe("replay tokens", () => {
  it("round-trips YouTube as a plain 11-char id", () => {
    const source = { kind: "youtube" as const, id: "dQw4w9WgXcQ" };
    expect(replayToken(source)).toBe("dQw4w9WgXcQ");
    expect(parseReplayToken("dQw4w9WgXcQ")).toEqual(source);
    expect(replayEmbedUrl(source)).toBe("https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0");
  });

  it("round-trips Drive with a drive: prefix", () => {
    const id = "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms";
    const source = { kind: "drive" as const, id, resourceKey: "0-abcDEF" };
    const token = replayToken(source);
    expect(token.startsWith("drive:")).toBe(true);
    expect(parseReplayToken(token)).toEqual(source);
    expect(replayWatchUrl(source)).toContain(`/file/d/${id}/view`);
    expect(replayEmbedUrl(source)).toBe(
      `https://drive.google.com/file/d/${id}/preview?resourcekey=0-abcDEF`
    );
  });
});
