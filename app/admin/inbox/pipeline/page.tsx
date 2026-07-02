"use client";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

const CRMPipeline = dynamic(() => import("@/components/pages/CRMPipeline"), {
  loading: () => <div className="flex h-[400px] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-blue" /></div>,
  ssr: false
});

function PipelineContent() {
  const searchParams = useSearchParams();
  const leadIdParam = searchParams?.get("leadId");
  const deepLinkLeadId = leadIdParam ? parseInt(leadIdParam, 10) : null;

  return (
    <div className="flex-1 overflow-auto bg-slate-50 p-0 md:p-6">
      <CRMPipeline deepLinkLeadId={Number.isFinite(deepLinkLeadId) ? deepLinkLeadId : null} />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="flex h-[400px] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-blue" /></div>}>
      <PipelineContent />
    </Suspense>
  );
}