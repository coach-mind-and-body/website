"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { getLoginUrl } from "@/lib/const";
import { LibraryPager } from "@/components/forms/LibraryPager";

export default function LibraryItemClient() {
  const params = useParams<{ kind: string; id: string }>();
  const kind = params?.kind === "group" ? "group" : "file";
  const id = Number(params?.id);
  const { loading, isAuthenticated } = useAuth();
  const item = trpc.forms.getLibraryItem.useQuery(
    { kind, id },
    { enabled: isAuthenticated && (kind === "file" || kind === "group") && id > 0 }
  );

  useEffect(() => {
    if (!loading && !isAuthenticated) window.location.href = getLoginUrl();
  }, [loading, isAuthenticated]);

  if (!item.data) {
    return <div className="flex min-h-screen items-center justify-center" style={{ background: "#faf5f5" }}>Loading pages…</div>;
  }

  return (
    <main className="min-h-screen px-4 py-6" style={{ background: "#faf5f5" }}>
      <div className="mx-auto max-w-lg">
        <Link href="/portal/forms" className="text-sm font-bold" style={{ color: "#c9a96e" }}>← Worksheets</Link>
        <div className="mt-4">
          <LibraryPager pages={item.data.pages} title={item.data.title} />
        </div>
      </div>
    </main>
  );
}
