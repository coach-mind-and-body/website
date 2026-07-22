import PortalClient from "./PortalClient";

export const metadata = {
  title: "Client Portal | Mind and Body Reset",
  description:
    "Your personal coaching portal — access program materials, schedule sessions, and track your wellness journey with Mind & Body Reset Coaches.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <PortalClient />;
}
