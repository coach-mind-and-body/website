"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function AdminModuleAssignment({ userId }: { userId: number }) {
  const { data: modules, isLoading } = trpc.reclaimHub.adminListModules.useQuery();
  const [selectedModule, setSelectedModule] = useState<number | "">("");

  const assignModule = trpc.reclaimHub.adminAssignModule.useMutation({
    onSuccess: () => {
      toast.success("Module assigned successfully!");
      setSelectedModule("");
    },
    onError: (e) => toast.error(e.message)
  });

  if (isLoading) return <div className="text-xs" style={{ color: "oklch(0.60 0.02 160)" }}>Loading modules...</div>;

  return (
    <div className="flex gap-2 items-center">
      <select 
        value={selectedModule} 
        onChange={e => setSelectedModule(e.target.value ? Number(e.target.value) : "")}
        className="text-xs rounded-lg px-2 py-1.5"
        style={{ background: "oklch(0.28 0.02 160)", color: "oklch(0.88 0.01 160)", border: "1px solid oklch(0.42 0.02 160)" }}
      >
        <option value="">Select a Module</option>
        {modules?.map(m => (
          <option key={m.id} value={m.id}>{m.title}</option>
        ))}
      </select>
      <Button 
        size="sm" 
        onClick={() => assignModule.mutate({ userId, moduleId: selectedModule as number })}
        disabled={selectedModule === "" || assignModule.isPending}
        style={{ background: "oklch(0.72 0.12 75)", color: "oklch(0.18 0.02 160)" }}
      >
        Assign Module
      </Button>
    </div>
  );
}
