import { Suspense } from "react";
import { notFound } from "next/navigation";
import FormPreviewClient from "./FormPreviewClient";

export default function Page() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <Suspense fallback={null}>
      <FormPreviewClient />
    </Suspense>
  );
}
