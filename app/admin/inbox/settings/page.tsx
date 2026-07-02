import { Metadata } from "next";
import SettingsClient from "./SettingsClient";

export const metadata: Metadata = {
  title: "Settings | Inbox | Mind and Body"
};

export default function SettingsPage() {
  return <SettingsClient />;
}
