/**
 * Google and Apple sign-in must land on the account that already has this
 * email (including one an admin created) instead of a second user.
 */

export type AuthAccountRow = {
  id: number;
  openId: string;
  email: string | null;
  name: string | null;
  googleId: string | null;
  appleId: string | null;
  enrollmentCount?: number;
};

export type SignInIdentity = {
  openId: string;
  email: string;
  googleId?: string | null;
  appleId?: string | null;
};

/** Placeholder we invent when Apple hides the email. It is not a real inbox. */
export function isGeneratedApplePlaceholder(email: string): boolean {
  return /^apple-[a-z0-9]+@privaterelay\.appleid\.com$/i.test(email.trim());
}

function byEmail(accounts: AuthAccountRow[], email: string): AuthAccountRow[] {
  return accounts
    .filter((account) => (account.email ?? "").trim().toLowerCase() === email)
    .sort((a, b) => {
      const enrollmentGap = (b.enrollmentCount ?? 0) - (a.enrollmentCount ?? 0);
      if (enrollmentGap !== 0) return enrollmentGap;
      return a.id - b.id;
    });
}

export function findAccountForSignIn(
  accounts: AuthAccountRow[],
  identity: SignInIdentity
): AuthAccountRow | null {
  const byOpenId = accounts.find((account) => account.openId === identity.openId);
  const email = identity.email.trim().toLowerCase();
  const emailMatches =
    email && !isGeneratedApplePlaceholder(email) ? byEmail(accounts, email) : [];
  const enrolled = emailMatches.find((account) => (account.enrollmentCount ?? 0) > 0);

  if (byOpenId && (byOpenId.enrollmentCount ?? 0) > 0) return byOpenId;
  if (enrolled) return enrolled;
  if (byOpenId) return byOpenId;

  if (identity.googleId) {
    const byGoogle = accounts.find((account) => account.googleId && account.googleId === identity.googleId);
    if (byGoogle) return byGoogle;
  }

  if (identity.appleId) {
    const byApple = accounts.find((account) => account.appleId && account.appleId === identity.appleId);
    if (byApple) return byApple;
  }

  return emailMatches[0] ?? null;
}

export function isGmailAddress(email: string): boolean {
  return /@(gmail|googlemail)\.com$/i.test(email.trim());
}
