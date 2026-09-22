import type { Metadata } from "next";
import "./this-week.css";

export const metadata: Metadata = {
  title: "This Week — coaching pairs",
  description: "Who's in this week, and who you're paired with.",
  robots: { index: false, follow: false },
};

export default function ThisWeekLayout({ children }: { children: React.ReactNode }) {
  return <div className="this-week">{children}</div>;
}
