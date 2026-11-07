import type { Metadata } from "next";
import ClientIntakePage from "./ClientIntakePage";

export const metadata: Metadata = {
  title: { absolute: "Client Intake Form" },
  description: "Metabolic coaching intake for clients of Lee Anne Chapman.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/client-intake" },
};

export default function Page() {
  return <ClientIntakePage />;
}
