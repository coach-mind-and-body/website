"use client";

import { useEffect, useState } from "react";
import { Loader2, Search, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";

export function AdminAssignmentsPanel() {
  const utils = trpc.useUtils();
  const [mealPlanId, setMealPlanId] = useState<number | "">("");
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(q.trim()), 280);
    return () => window.clearTimeout(t);
  }, [q]);

  const { data: plans, isLoading: plansLoading } = trpc.food.listMealPlans.useQuery({
    includeDrafts: true,
  });
  const { data: clients, isLoading: clientsLoading } = trpc.food.adminSearchClients.useQuery({
    q: debouncedQ || undefined,
  });
  const { data: assignments, isLoading: assignmentsLoading } = trpc.food.adminListAssignments.useQuery({
    mealPlanId: mealPlanId === "" ? undefined : mealPlanId,
  });

  const assign = trpc.food.adminAssign.useMutation({
    onSuccess: () => {
      toast.success("Meal plan assigned");
      setNotes("");
      utils.food.adminListAssignments.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const unassign = trpc.food.adminUnassign.useMutation({
    onSuccess: () => {
      toast.success("Assignment removed");
      utils.food.adminListAssignments.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const selectedClient = clients?.find((c) => c.id === selectedUserId) ?? null;

  return (
    <div className="space-y-8">
      <div>
        <h3
          className="font-bold text-2xl mb-1"
          style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.20 0.015 50)" }}
        >
          Assign meal plans
        </h3>
        <p className="text-sm" style={{ color: "oklch(0.52 0.015 50)" }}>
          One active plan per client. Assigning again replaces their current plan.
        </p>
      </div>

      <div
        className="p-5 rounded-2xl border space-y-4"
        style={{ background: "oklch(0.96 0.025 50)", borderColor: "oklch(0.90 0.015 80)" }}
      >
        <div>
          <label className="text-sm block mb-1" style={{ color: "oklch(0.42 0.015 50)" }}>
            Meal plan
          </label>
          {plansLoading ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <select
              value={mealPlanId === "" ? "" : String(mealPlanId)}
              onChange={(e) => setMealPlanId(e.target.value ? Number(e.target.value) : "")}
              className="w-full h-9 rounded-md border px-3 text-sm bg-white"
              style={{ borderColor: "oklch(0.90 0.015 80)", color: "oklch(0.20 0.015 50)" }}
            >
              <option value="">Select a meal plan…</option>
              {(plans ?? []).map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.title}
                  {plan.isPublished ? "" : " (draft)"}
                  {plan.isFeatured ? " · featured" : ""}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="text-sm block mb-1" style={{ color: "oklch(0.42 0.015 50)" }}>
            Search clients
          </label>
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "oklch(0.52 0.015 50)" }}
            />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Name or email"
              className="pl-9"
              style={{ background: "oklch(0.985 0.008 80)" }}
            />
          </div>
        </div>

        <div className="max-h-52 overflow-y-auto space-y-1">
          {clientsLoading ? (
            <div className="py-4 flex justify-center" style={{ color: "oklch(0.72 0.12 75)" }}>
              <Loader2 className="animate-spin" size={16} />
            </div>
          ) : !clients?.length ? (
            <p className="text-sm" style={{ color: "oklch(0.52 0.015 50)" }}>
              No clients found.
            </p>
          ) : (
            clients.map((client) => {
              const active = selectedUserId === client.id;
              return (
                <button
                  key={client.id}
                  type="button"
                  onClick={() => setSelectedUserId(client.id)}
                  className="w-full text-left px-3 py-2 rounded-lg border"
                  style={{
                    borderColor: active ? "oklch(0.72 0.12 75)" : "oklch(0.90 0.015 80)",
                    background: active ? "oklch(0.98 0.02 75)" : "white",
                  }}
                >
                  <p className="text-sm font-semibold" style={{ color: "oklch(0.20 0.015 50)" }}>
                    {client.name || "Unnamed"}
                  </p>
                  <p className="text-xs" style={{ color: "oklch(0.52 0.015 50)" }}>
                    {client.email}
                  </p>
                </button>
              );
            })
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm block mb-1" style={{ color: "oklch(0.42 0.015 50)" }}>
              Start date (optional)
            </label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="text-sm block mb-1" style={{ color: "oklch(0.42 0.015 50)" }}>
              Notes
            </label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </div>

        <Button
          type="button"
          disabled={assign.isPending || mealPlanId === "" || selectedUserId == null}
          onClick={() => {
            if (mealPlanId === "" || selectedUserId == null) {
              return toast.error("Pick a meal plan and a client");
            }
            assign.mutate({
              mealPlanId,
              userId: selectedUserId,
              startDate: startDate || null,
              notes: notes.trim() || null,
            });
          }}
          style={{ background: "oklch(0.72 0.12 75)", color: "oklch(1 0 0)" }}
        >
          {assign.isPending ? <Loader2 className="animate-spin" size={16} /> : <UserPlus size={16} />}
          Assign{selectedClient?.name ? ` to ${selectedClient.name}` : ""}
        </Button>
      </div>

      <div>
        <h4 className="font-bold text-lg mb-3" style={{ color: "oklch(0.20 0.015 50)" }}>
          Current assignments
        </h4>
        {assignmentsLoading ? (
          <div className="py-8 flex justify-center" style={{ color: "oklch(0.72 0.12 75)" }}>
            <Loader2 className="animate-spin" />
          </div>
        ) : !assignments?.length ? (
          <p className="text-sm" style={{ color: "oklch(0.52 0.015 50)" }}>
            {mealPlanId === "" ? "No assignments yet." : "No one is assigned to this plan yet."}
          </p>
        ) : (
          <div className="space-y-2">
            {assignments.map((row) => (
              <div
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border bg-white"
                style={{ borderColor: "oklch(0.90 0.015 80)" }}
              >
                <div>
                  <p className="text-sm font-semibold" style={{ color: "oklch(0.20 0.015 50)" }}>
                    {row.clientName || "Unnamed"}{" "}
                    <span className="font-normal" style={{ color: "oklch(0.52 0.015 50)" }}>
                      {row.clientEmail}
                    </span>
                  </p>
                  <p className="text-xs" style={{ color: "oklch(0.52 0.015 50)" }}>
                    {row.planTitle ?? `Plan #${row.mealPlanId}`}
                    {row.startDate ? ` · starts ${row.startDate}` : ""}
                    {row.notes ? ` · ${row.notes}` : ""}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={unassign.isPending}
                  onClick={() => {
                    if (!confirm(`Unassign ${row.clientName || row.clientEmail || "this client"}?`)) return;
                    unassign.mutate({ id: row.id });
                  }}
                >
                  Unassign
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
