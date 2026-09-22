export type Member = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  token: string;
  active: boolean;
  createdAt: string;
};

export type Week = {
  id: number;
  weekStart: string;
  status: "open" | "matched";
  groupsJson: string | null;
  matchedAt: string | null;
  reminderSentAt: string | null;
  nudgeSentAt: string | null;
  matchNoticeSentAt: string | null;
};

export type Rsvp = {
  id: number;
  weekId: number;
  memberId: number;
  status: "in" | "out";
  respondedAt: string;
};
