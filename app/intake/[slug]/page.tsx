import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ClientIntakePage from "@/app/client-intake/ClientIntakePage";
import { noindexWithoutInheritedCanonical } from "@/lib/noindexMetadata";
import { PROGRAMS } from "@shared/programs";
import { intakeFormKind, programIdFromIntakeSlug } from "@shared/programIntake";
import ProgramIntakeClient from "./ProgramIntakeClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const kind = intakeFormKind(slug);
  if (kind === "unknown") return noindexWithoutInheritedCanonical({ title: { absolute: "Intake" } });
  if (kind === "metabolic") {
    return noindexWithoutInheritedCanonical({
      title: { absolute: "Client Intake Form" },
      description: "Metabolic coaching intake for clients of Lee Anne Chapman.",
    });
  }
  const program = programIdFromIntakeSlug(slug);
  const label = program ? PROGRAMS[program].label : "Program";
  return noindexWithoutInheritedCanonical({
    title: { absolute: `${label} intake` },
    description: `Intake for ${label} with Lee Anne Chapman.`,
  });
}

export default async function IntakeSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const kind = intakeFormKind(slug);
  if (kind === "unknown") notFound();
  if (kind === "metabolic") return <ClientIntakePage />;
  const program = programIdFromIntakeSlug(slug);
  if (!program) notFound();
  return <ProgramIntakeClient program={program} />;
}
