import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { sdk } from "@/server/_core/sdk";

export const metadata = {
  robots: { index: false, follow: false },
  title: "Admin | Mind and Body Reset",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const cookie = headersList.get("cookie") ?? "";
  const req = new Request("http://localhost/admin", {
    headers: { cookie },
  });

  try {
    const user = await sdk.authenticateNextRequest(req);
    if (user.role !== "admin") {
      redirect("/login");
    }
  } catch {
    redirect("/login");
  }

  return <>{children}</>;
}