"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export default function AdminModuleAssignment({ userId }: { userId: number }) {
  const utils = trpc.useUtils();
  const { data: modules, isLoading: modulesLoading } = trpc.reclaimHub.adminListModules.useQuery();
  const { data: progress, isLoading: progressLoading } = trpc.reclaimHub.adminGetClientProgress.useQuery({ userId });
  
  const [selectedModule, setSelectedModule] = useState<number | "">("");

  const assignModule = trpc.reclaimHub.adminAssignModule.useMutation({
    onSuccess: () => {
      toast.success("Module assigned successfully!");
      setSelectedModule("");
      utils.reclaimHub.adminGetClientProgress.invalidate({ userId });
    },
    onError: (e) => toast.error(e.message)
  });

  const unassignModule = trpc.reclaimHub.adminUnassignModule.useMutation({
    onSuccess: () => {
      toast.success("Module unassigned!");
      utils.reclaimHub.adminGetClientProgress.invalidate({ userId });
    },
    onError: (e) => toast.error(e.message)
  });

  if (modulesLoading || progressLoading) {
    return <div className="text-xs" style={{ color: "oklch(0.52 0.015 50)" }}>Loading modules...</div>;
  }

  // Modules that the client currently has assigned
  const assignedModules = modules?.filter(m => progress?.some(p => p.moduleId === m.id) || m.order === 1) ?? [];
  // For safety, let's just show progress. Wait, if module 1 (index 0) is auto-unlocked by the backend for everyone, we should show it here.
  const actuallyAssignedModules = modules?.filter((m, idx) => progress?.some(p => p.moduleId === m.id) || idx === 0) ?? [];
  
  const unassignedModules = modules?.filter((m, idx) => !progress?.some(p => p.moduleId === m.id) && idx !== 0) ?? [];

  return (
    <div className="space-y-4">
      {/* List assigned modules */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: "oklch(0.52 0.015 50)" }}>Currently Assigned</h4>
        {actuallyAssignedModules.length === 0 ? (
          <p className="text-xs" style={{ color: "oklch(0.52 0.015 50)" }}>No modules assigned.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {actuallyAssignedModules.map((m, idx) => (
              <div 
                key={m.id} 
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm"
                style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0.90 0.015 80)", color: "oklch(0.20 0.015 50)" }}
              >
                {m.title}
                {idx !== 0 && ( // Don't allow unassigning the first module if it's auto-unlocked
                  <button 
                    onClick={() => {
                      if (confirm(`Remove access to ${m.title}?`)) {
                        unassignModule.mutate({ userId, moduleId: m.id });
                      }
                    }}
                    disabled={unassignModule.isPending}
                    className="p-0.5 rounded-md hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assign new module */}
      {unassignedModules.length > 0 && (
        <div className="flex gap-2 items-center pt-2 border-t" style={{ borderColor: "oklch(0.96 0.025 50)" }}>
          <select 
            value={selectedModule} 
            onChange={e => setSelectedModule(e.target.value ? Number(e.target.value) : "")}
            className="text-xs rounded-lg px-2 py-1.5 flex-1 max-w-[200px]"
            style={{ background: "oklch(0.985 0.008 80)", color: "oklch(0.20 0.015 50)", border: "1px solid oklch(0.52 0.015 50)" }}
          >
            <option value="">Select a Module to Assign...</option>
            {unassignedModules.map(m => (
              <option key={m.id} value={m.id}>{m.title}</option>
            ))}
          </select>
          <Button 
            size="sm" 
            onClick={() => assignModule.mutate({ userId, moduleId: selectedModule as number })}
            disabled={selectedModule === "" || assignModule.isPending}
            style={{ background: "oklch(0.72 0.12 75)", color: "oklch(1 0 0)" }}
          >
            Assign
          </Button>
        </div>
      )}
    </div>
  );
}
