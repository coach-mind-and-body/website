import CoachChatClient from "./CoachChatClient";
import { noindexWithoutInheritedCanonical } from "@/lib/noindexMetadata";

export const metadata = noindexWithoutInheritedCanonical({
  title: { absolute: "Coach | Mind & Body Reset Habit Tracker" },
  description:
    "Message Lee Anne privately from the Habit Tracker — your week, recipes, and what's feeling loud.",
});

export default function CoachChatPage() {
  return <CoachChatClient />;
}
