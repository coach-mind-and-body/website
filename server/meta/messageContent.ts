const ATTACHMENT_LABELS: Record<string, string> = {
  image: "[Image]",
  video: "[Video]",
  audio: "[Audio]",
  file: "[File]",
  sticker: "[Sticker]",
  share: "[Shared link]",
  story_mention: "[Story mention]",
  ig_reel: "[Reel]",
  reel: "[Reel]",
};

type MetaMessage = {
  text?: string;
  attachments?: Array<{ type?: string }>;
};

/** Extract displayable content from a Meta/Instagram messaging payload. */
export function extractMetaMessageContent(message?: MetaMessage | null): string | null {
  if (!message) return null;
  if (message.text?.trim()) return message.text.trim();

  const attachments = message.attachments;
  if (!attachments?.length) return null;

  const types = attachments.map((a) => a.type).filter(Boolean) as string[];
  if (types.length === 1) {
    return ATTACHMENT_LABELS[types[0]] ?? `[${types[0]}]`;
  }
  return `[${attachments.length} attachments]`;
}

export function resolveMetaPlatform(
  bodyObject: string,
  webhookEvent: { messaging_product?: string }
): "facebook" | "instagram" {
  if (webhookEvent.messaging_product === "instagram") return "instagram";
  if (bodyObject === "instagram") return "instagram";
  return "facebook";
}