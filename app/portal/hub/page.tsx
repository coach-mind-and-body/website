import ReclaimHubClient from "./ReclaimHubClient";

export const metadata = {
  title: "Reclaim Hub | Mind and Body Reset",
  description: "Access your R.E.C.L.A.I.M. modules, workshops, and assignments.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ReclaimHubClient />;
}
