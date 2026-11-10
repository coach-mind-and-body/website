import { describe, expect, it } from "vitest";
import { findAccountForSignIn, isGeneratedApplePlaceholder, type AuthAccountRow } from "./authAccount";
import { buildWelcomeSetPasswordContent } from "./notifications";

const enrolledGmail: AuthAccountRow = {
  id: 7,
  openId: "email:jane@gmail.com",
  email: "jane@gmail.com",
  name: "Jane Doe",
  googleId: null,
  appleId: null,
  enrollmentCount: 2,
};

describe("findAccountForSignIn", () => {
  it("attaches Google sign-in to the admin-created account with the same email", () => {
    const match = findAccountForSignIn([enrolledGmail], {
      openId: "google:998877",
      email: "Jane@gmail.com",
      googleId: "998877",
    });
    expect(match?.id).toBe(7);
    expect(match?.openId).toBe("email:jane@gmail.com");
  });

  it("attaches Apple sign-in to the same account when the email matches", () => {
    const match = findAccountForSignIn([enrolledGmail], {
      openId: "apple:abc",
      email: "jane@gmail.com",
      appleId: "abc",
    });
    expect(match?.id).toBe(7);
  });

  it("keeps using the linked account on a later Google sign-in", () => {
    const linked = { ...enrolledGmail, googleId: "998877" };
    const match = findAccountForSignIn([linked], {
      openId: "google:998877",
      email: "jane@gmail.com",
      googleId: "998877",
    });
    expect(match?.id).toBe(7);
  });

  it("prefers the account that already has enrollments when emails collide", () => {
    const empty: AuthAccountRow = {
      id: 1,
      openId: "google:old",
      email: "jane@gmail.com",
      name: "Jane",
      googleId: "old",
      appleId: null,
      enrollmentCount: 0,
    };
    const match = findAccountForSignIn([empty, enrolledGmail], {
      openId: "google:new",
      email: "jane@gmail.com",
      googleId: "new",
    });
    expect(match?.id).toBe(7);
  });

  it("does not attach a hidden Apple login to a random account", () => {
    expect(isGeneratedApplePlaceholder("apple-abc123@privaterelay.appleid.com")).toBe(true);
    const match = findAccountForSignIn([enrolledGmail], {
      openId: "apple:abc",
      email: "apple-abc123@privaterelay.appleid.com",
      appleId: "abc",
    });
    expect(match).toBeNull();
  });

  it("uses the enrolled account even if an older Google login has the same email", () => {
    const olderGoogle: AuthAccountRow = {
      id: 2,
      openId: "google:998877",
      email: "jane@gmail.com",
      name: "Jane",
      googleId: "998877",
      appleId: null,
      enrollmentCount: 0,
    };
    const match = findAccountForSignIn([olderGoogle, enrolledGmail], {
      openId: "google:998877",
      email: "jane@gmail.com",
      googleId: "998877",
    });
    expect(match?.id).toBe(7);
  });

  it("creates no match for a brand new email", () => {
    const match = findAccountForSignIn([enrolledGmail], {
      openId: "google:111",
      email: "someoneelse@gmail.com",
      googleId: "111",
    });
    expect(match).toBeNull();
  });
});

describe("welcome email for Gmail", () => {
  it("tells a Gmail client they can continue with Google", () => {
    const content = buildWelcomeSetPasswordContent({
      clientName: "Jane Doe",
      clientEmail: "jane@gmail.com",
      resetToken: "tok",
      program: "metabolic",
    });
    expect(content.htmlBody).toContain("You use Gmail");
    expect(content.htmlBody).toContain("Continue with Google");
    expect(content.htmlBody).toContain("this same account");
    expect(content.textBody).toContain("Continue with Google");
    expect(content.subject).toContain("Metabolic Coaching");
    expect(content.subject).not.toContain("R.E.C.L.A.I.M.");
  });

  it("keeps the original Reclaim wording when the address is not Gmail", () => {
    const content = buildWelcomeSetPasswordContent({
      clientName: "Jane Doe",
      clientEmail: "jane@example.com",
      resetToken: "tok",
      program: "reclaim",
    });
    expect(content.subject).toBe("Welcome to R.E.C.L.A.I.M., Jane! Action Required");
    expect(content.htmlBody).toContain("the <strong>R.E.C.L.A.I.M. program</strong>");
    expect(content.htmlBody).not.toContain("You use Gmail");
    expect(content.textBody).toContain("Welcome to R.E.C.L.A.I.M.!");
  });
});
