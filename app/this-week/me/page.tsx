import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Personal view now lives on the main board. */
export default function MePage() {
  redirect("/this-week");
}
