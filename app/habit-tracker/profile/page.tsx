import ProfileClient from "./ProfileClient";

export const metadata = {
  title: { absolute: "Profile & Settings | Mind & Body Reset Habit Tracker" },
  description: "Manage your account, notifications, and privacy settings.",
};

export default function ProfilePage() {
  return <ProfileClient />;
}
