import ProfileClient from "./ProfileClient";
import { noindexWithoutInheritedCanonical } from "@/lib/noindexMetadata";

export const metadata = noindexWithoutInheritedCanonical({
  title: { absolute: "Profile & Settings | Mind & Body Reset Habit Tracker" },
  description: "Manage your account, notifications, and privacy settings.",
});

export default function ProfilePage() {
  return <ProfileClient />;
}
