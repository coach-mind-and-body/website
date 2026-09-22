import { isAdmin } from "@/lib/weekly-pairs/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isAdmin())) redirect("/this-week/admin/login");
  return children;
}
