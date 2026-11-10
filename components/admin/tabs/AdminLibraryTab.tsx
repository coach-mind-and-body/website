"use client";

import { ChefHat, FolderOpen } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AdminFoodVaultTab } from "@/components/admin/AdminFoodVaultTab";
import { AdminPillNav } from "@/components/admin/AdminPillNav";
import { AdminCommonFilesTab } from "@/components/admin/tabs/AdminCommonFilesTab";
import { librarySection, resolvedAdminParams } from "@/lib/adminNav";

export function AdminLibraryTab() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const section = librarySection(resolvedAdminParams(searchParams.toString()).get("section"));

  function select(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "library");
    params.set("section", next);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div>
      <p className="text-sm mb-4 max-w-xl" style={{ color: "oklch(0.52 0.015 50)" }}>
        Files you share with clients, and the recipes in the food vault.
      </p>
      <div className="mb-6">
        <AdminPillNav
          size="sm"
          label="Library"
          activeId={section}
          onSelect={select}
          items={[
            { id: "files", label: "Files", icon: FolderOpen },
            { id: "food", label: "Food Vault", icon: ChefHat },
          ]}
        />
      </div>
      {section === "files" ? <AdminCommonFilesTab /> : <AdminFoodVaultTab />}
    </div>
  );
}
