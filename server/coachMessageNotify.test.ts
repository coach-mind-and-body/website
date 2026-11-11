import { describe, expect, it, vi } from "vitest";
import {
  buildCoachReplyFallbackEmail,
  COACH_REPLY_EMAIL_DELAY_MS,
  decideUnreadCoachEmail,
  notifyAdminsOfClientMessage,
  notifyClientOfCoachMessage,
  processUnreadCoachReplyEmails,
  type UnreadNotice,
} from "./coachMessageNotify";

const now = new Date("2026-11-11T15:00:00.000Z");

function notice(overrides: Partial<UnreadNotice> = {}): UnreadNotice {
  return {
    id: 1,
    email: "client@example.com",
    name: "Ava",
    preview: "See you Thursday",
    messageCreatedAt: new Date(now.getTime() - COACH_REPLY_EMAIL_DELAY_MS - 60_000),
    clientLastReadAt: null,
    dueAt: new Date(now.getTime() - 1000),
    sentAt: null,
    ...overrides,
  };
}

describe("coach reply notifications", () => {
  it("pushes a coach reply to that client's devices and queues one unread email", async () => {
    const send = vi.fn().mockResolvedValue({ sent: 1, failed: 0, removed: [], skipped: false });
    const queueEmail = vi.fn().mockResolvedValue(undefined);
    await notifyClientOfCoachMessage(
      { userId: 7, conversationId: 3, messageId: 9, preview: "See you Thursday" },
      {
        tokensForUser: async () => ["aa".repeat(32)],
        send,
        queueEmail,
        forgetTokens: async () => {},
        config: {
          keyId: "k",
          teamId: "t",
          keyP8: "p",
          bundleId: "com.mindandbodyreset.habittracker",
          environment: "sandbox",
        },
      }
    );
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        tokens: ["aa".repeat(32)],
        alert: { title: "Lee Anne sent a message", body: "See you Thursday" },
        data: { tab: "coach", url: "/habit-tracker/coach", conversationId: 3 },
      })
    );
    expect(queueEmail).toHaveBeenCalledTimes(1);
    expect(queueEmail).toHaveBeenCalledWith(
      expect.objectContaining({ messageId: 9, userId: 7, conversationId: 3 })
    );
  });

  it("forgets a token Apple says is gone", async () => {
    const forgetTokens = vi.fn();
    await notifyClientOfCoachMessage(
      { userId: 7, conversationId: 3, messageId: 9, preview: "Hi" },
      {
        tokensForUser: async () => ["dead"],
        send: async () => ({ sent: 0, failed: 1, removed: ["dead"], skipped: false }),
        queueEmail: async () => {},
        forgetTokens,
        config: null,
      }
    );
    expect(forgetTokens).toHaveBeenCalledWith(["dead"]);
  });

  it("pushes a new client message to admin devices and does not queue the client email", async () => {
    const send = vi.fn().mockResolvedValue({ sent: 1, failed: 0, removed: [], skipped: false });
    await notifyAdminsOfClientMessage(
      { conversationId: 11, preview: "The evening was loud", clientName: "Ava" },
      {
        tokens: async () => ["bb".repeat(32)],
        send,
        forgetTokens: async () => {},
        config: null,
      }
    );
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        tokens: ["bb".repeat(32)],
        alert: { title: "New client message", body: "Ava: The evening was loud" },
        data: { tab: "coach", url: "/admin", conversationId: 11 },
      })
    );
  });

  it("emails only after the delay, only while the thread is still unread, and only once", async () => {
    expect(decideUnreadCoachEmail(notice({ dueAt: new Date(now.getTime() + 60_000) }), now)).toBe("wait");
    expect(
      decideUnreadCoachEmail(
        notice({ clientLastReadAt: new Date(now.getTime() - 30_000) }),
        now
      )
    ).toBe("skip-read");
    expect(decideUnreadCoachEmail(notice({ sentAt: now }), now)).toBe("already-sent");
    expect(decideUnreadCoachEmail(notice({ email: null }), now)).toBe("skip-no-email");
    expect(decideUnreadCoachEmail(notice(), now)).toBe("send");

    let locked = false;
    const sendEmail = vi.fn().mockResolvedValue(true);
    const claim = vi.fn(async () => {
      if (locked) return false;
      locked = true;
      return true;
    });
    const release = vi.fn(async () => {
      locked = false;
    });
    const args = {
      rows: [notice()],
      now,
      claim,
      release,
      sendEmail,
    };
    const [first, second] = await Promise.all([
      processUnreadCoachReplyEmails(args),
      processUnreadCoachReplyEmails(args),
    ]);
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(first.sent + second.sent).toBe(1);

    sendEmail.mockClear();
    const readClaim = vi.fn().mockResolvedValue(true);
    await processUnreadCoachReplyEmails({
      rows: [notice({ id: 2, clientLastReadAt: now })],
      now,
      claim: readClaim,
      release,
      sendEmail,
    });
    expect(readClaim).toHaveBeenCalledWith(2);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("releases the claim when the email sender fails so a later pass can retry", async () => {
    const release = vi.fn().mockResolvedValue(undefined);
    const result = await processUnreadCoachReplyEmails({
      rows: [notice()],
      now,
      claim: async () => true,
      release,
      sendEmail: async () => false,
    });
    expect(result.sent).toBe(0);
    expect(release).toHaveBeenCalledWith(1);
  });

  it("builds a plain fallback email with the thread link and escaped preview", () => {
    const email = buildCoachReplyFallbackEmail('Hi <script>alert("x")</script>');
    expect(email.subject).toBe("Lee Anne sent you a message");
    expect(email.htmlBody).toContain("&lt;script&gt;");
    expect(email.htmlBody).not.toContain("<script>");
    expect(email.textBody).toContain("https://mindandbodyresetcoach.com/habit-tracker/coach");
    expect(email.htmlBody).not.toMatch(/APNS_|BEGIN PRIVATE KEY|sk_live/);
  });
});
