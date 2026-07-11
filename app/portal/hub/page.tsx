import ReclaimHubClient from "./ReclaimHubClient";

export const metadata = {
  title: "My Modules | Mind and Body Reset",
  description:
    "Your assigned R.E.C.L.A.I.M. modules, worksheets, and assignments — only what your coach has unlocked for you.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ReclaimHubClient />;
}
