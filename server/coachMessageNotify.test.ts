import { describe, expect, it, vi } from "vitest";
import {
  buildCoachReplyFallbackEmail,
  buildCoachUnreadAlertEmail,
  COACH_REPLY_EMAIL_DELAY_MS,
  decideUnreadCoachEmail,
  notifyAdminsOfClientMessage,
  notifyClientOfCoachMessage,
  planUnreadThreadEmails,
  processUnreadCoachReplyEmails,
  processUnreadThreadEmails,
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
        data: {
          tab: "coach",
          url: "/habit-tracker/coach",
          category: "coach-message",
          conversationId: 3,
          threadId: 3,
          messageId: 9,
          mutableContent: true,
        },
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
        data: {
          tab: "coach",
          url: "/admin",
          category: "coach-client-message",
          conversationId: 11,
          threadId: 11,
          mutableContent: true,
        },
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

  it("sends Lee Anne one email per unread thread after 10 minutes, and none if she already read it", async () => {
    const older = notice({
      id: 11,
      conversationId: 4,
      name: "Ava",
      preview: "The evening was loud",
      messageCreatedAt: new Date(now.getTime() - 12 * 60 * 1000),
      email: "coach@mindandbodyresetcoach.com",
    });
    const newer = notice({
      id: 12,
      conversationId: 4,
      name: "Ava",
      preview: "Still sitting with it",
      messageCreatedAt: new Date(now.getTime() - 11 * 60 * 1000),
      email: "coach@mindandbodyresetcoach.com",
    });
    const otherThread = notice({
      id: 21,
      conversationId: 8,
      name: "Bea",
      preview: "Can we move Thursday?",
      email: "coach@mindandbodyresetcoach.com",
    });
    const alreadyRead = notice({
      id: 13,
      conversationId: 4,
      clientLastReadAt: now,
      email: "coach@mindandbodyresetcoach.com",
    });
    const tooSoon = notice({
      id: 14,
      conversationId: 9,
      dueAt: new Date(now.getTime() + 60_000),
      email: "coach@mindandbodyresetcoach.com",
    });

    const plan = planUnreadThreadEmails([older, newer, otherThread, alreadyRead, tooSoon], now);
    expect(plan.waitIds).toEqual([14]);
    expect(plan.skipIds).toEqual([13]);
    expect(plan.batches).toHaveLength(2);
    const ava = plan.batches.find((batch) => batch.conversationId === 4);
    expect(ava).toMatchObject({
      clientName: "Ava",
      count: 2,
      preview: "Still sitting with it",
      noticeIds: [11, 12],
    });

    let locked = false;
    const sendEmail = vi.fn().mockResolvedValue(true);
    const claim = vi.fn(async (id: number) => {
      if (id === 11 && locked) return false;
      if (id === 11) locked = true;
      return true;
    });
    const release = vi.fn(async () => {
      locked = false;
    });
    const due = [older, newer];
    const [first, second] = await Promise.all([
      processUnreadThreadEmails({ rows: due, now, claim, release, sendEmail }),
      processUnreadThreadEmails({ rows: due, now, claim, release, sendEmail }),
    ]);
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(first.sent + second.sent).toBe(1);
    expect(sendEmail.mock.calls[0][0].count).toBeGreaterThan(0);

    sendEmail.mockClear();
    await processUnreadThreadEmails({
      rows: [alreadyRead],
      now,
      claim: async () => true,
      release,
      sendEmail,
    });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("builds a branded coach alert with the preview and the admin messages link", () => {
    const email = buildCoachUnreadAlertEmail({
      clientName: "Ava",
      preview: 'Hi <script>alert("x")</script>',
      count: 2,
    });
    expect(email.subject).toBe("2 unread messages from Ava");
    expect(email.htmlBody).toContain("Nunito Sans");
    expect(email.htmlBody).toContain("#c9a96e");
    expect(email.htmlBody).toContain("&lt;script&gt;");
    expect(email.htmlBody).not.toContain("<script>");
    expect(email.htmlBody).toContain("https://mindandbodyresetcoach.com/admin?tab=overview#admin-messages");
    expect(email.textBody).toContain("https://mindandbodyresetcoach.com/admin?tab=overview#admin-messages");
    expect(email.htmlBody).not.toMatch(/APNS_|BEGIN PRIVATE KEY|sk_live/);
  });

  it("queues one unread email for Lee Anne when a client message is saved", async () => {
    const queueEmail = vi.fn().mockResolvedValue(undefined);
    await notifyAdminsOfClientMessage(
      {
        conversationId: 11,
        preview: "The evening was loud",
        clientName: "Ava",
        messageId: 44,
        userId: 7,
      },
      {
        tokens: async () => [],
        send: async () => ({ sent: 0, failed: 0, removed: [], skipped: true }),
        forgetTokens: async () => {},
        queueEmail,
        config: null,
      }
    );
    expect(queueEmail).toHaveBeenCalledTimes(1);
    expect(queueEmail).toHaveBeenCalledWith(
      expect.objectContaining({ messageId: 44, conversationId: 11, userId: 7, preview: "The evening was loud" })
    );
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
