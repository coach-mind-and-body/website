export type ReplyPreview = {
  id: number;
  content: string | null;
  senderName: string | null;
};

type ReplySource = {
  id: number;
  replyToId?: number | null;
  content?: string | null;
  senderName?: string | null;
};

export function attachReplyPreviews<T extends ReplySource>(
  rows: T[]
): (T & { replyTo: ReplyPreview | null })[] {
  const byId = new Map(rows.map((row) => [row.id, row]));
  return rows.map((row) => {
    if (!row.replyToId) return { ...row, replyTo: null };
    const parent = byId.get(row.replyToId);
    return {
      ...row,
      replyTo: {
        id: row.replyToId,
        content: parent?.content ?? null,
        senderName: parent?.senderName ?? null,
      },
    };
  });
}

export function smsQuotePrefix(parent?: { content?: string | null; senderName?: string | null } | null): string {
  if (!parent) return "";
  const who = parent.senderName?.split(" ")[0] || "them";
  const snippet = (parent.content ?? "").replace(/\s+/g, " ").trim().slice(0, 80);
  if (!snippet) return "";
  return `↩ ${who}: ${snippet}`;
}
