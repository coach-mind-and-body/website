"use client";

import { BookOpen, Mail, Megaphone } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import AdminCrmAutomationsTab from "@/components/admin/AdminCrmAutomationsTab";
import { AdminNewsletterTab } from "@/components/admin/AdminNewsletterTab";
import { AdminPillNav } from "@/components/admin/AdminPillNav";
import { AdminBlogTab } from "@/components/admin/tabs/AdminBlogTab";
import { marketingSection, resolvedAdminParams } from "@/lib/adminNav";

export function AdminMarketingTab() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const section = marketingSection(resolvedAdminParams(searchParams.toString()).get("section"));

  function select(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "marketing");
    params.set("section", next);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div>
      <p className="text-sm mb-4 max-w-xl" style={{ color: "oklch(0.52 0.015 50)" }}>
        CRM and AI, newsletters, and the blog.
      </p>
      <div className="mb-6">
        <AdminPillNav
          size="sm"
          label="Marketing"
          activeId={section}
          onSelect={select}
          items={[
            { id: "crm", label: "CRM & AI", icon: Megaphone },
            { id: "newsletters", label: "Newsletters", icon: Mail },
            { id: "blog", label: "Blog", icon: BookOpen },
          ]}
        />
      </div>
      {section === "crm" && <AdminCrmAutomationsTab />}
      {section === "newsletters" && <AdminNewsletterTab />}
      {section === "blog" && <AdminBlogTab />}
    </div>
  );
}
