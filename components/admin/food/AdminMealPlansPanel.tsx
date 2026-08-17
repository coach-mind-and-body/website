"use client";

import { useState } from "react";
import { Copy, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { AdminMealPlanBuilder } from "./AdminMealPlanBuilder";
import { StatusBadge } from "./AdminRecipesPanel";

export function AdminMealPlansPanel() {
  const utils = trpc.useUtils();
  const [buildingId, setBuildingId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [servingsDefault, setServingsDefault] = useState(1);
  const [showNutrition, setShowNutrition] = useState(true);
  const [isPublished, setIsPublished] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);

  const { data: plans, isLoading } = trpc.food.listMealPlans.useQuery({ includeDrafts: true });

  const createPlan = trpc.food.adminCreateMealPlan.useMutation({
    onSuccess: (res) => {
      toast.success("Meal plan created");
      utils.food.listMealPlans.invalidate();
      resetCreate();
      setBuildingId(res.id);
    },
    onError: (e) => toast.error(e.message),
  });

  const duplicatePlan = trpc.food.adminDuplicateMealPlan.useMutation({
    onSuccess: (res) => {
      toast.success("Meal plan duplicated as a draft");
      utils.food.listMealPlans.invalidate();
      setBuildingId(res.id);
    },
    onError: (e) => toast.error(e.message),
  });

  const deletePlan = trpc.food.adminDeleteMealPlan.useMutation({
    onSuccess: () => {
      toast.success("Meal plan deleted");
      utils.food.listMealPlans.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const resetCreate = () => {
    setShowCreate(false);
    setTitle("");
    setDescription("");
    setNotes("");
    setServingsDefault(1);
    setShowNutrition(true);
    setIsPublished(false);
    setIsFeatured(false);
  };

  if (buildingId != null) {
    return <AdminMealPlanBuilder mealPlanId={buildingId} onBack={() => setBuildingId(null)} />;
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h3
            className="font-bold text-2xl mb-1"
            style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.20 0.015 50)" }}
          >
            Meal plans
          </h3>
          <p className="text-sm" style={{ color: "oklch(0.52 0.015 50)" }}>
            Build a 7-day grid, then assign it to a client.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => setShowCreate(true)}
          style={{ background: "oklch(0.72 0.12 75)", color: "oklch(1 0 0)" }}
        >
          <Plus size={16} /> New meal plan
        </Button>
      </div>

      {showCreate && (
        <div
          className="p-5 rounded-2xl border mb-6 space-y-3"
          style={{ background: "oklch(0.96 0.025 50)", borderColor: "oklch(0.90 0.015 80)" }}
        >
          <h4 className="font-bold" style={{ color: "oklch(0.20 0.015 50)" }}>
            Create plan
          </h4>
          <div>
            <label className="text-sm block mb-1" style={{ color: "oklch(0.42 0.015 50)" }}>
              Title
            </label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Week 1 Reset" />
          </div>
          <div>
            <label className="text-sm block mb-1" style={{ color: "oklch(0.42 0.015 50)" }}>
              Description
            </label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <div>
            <label className="text-sm block mb-1" style={{ color: "oklch(0.42 0.015 50)" }}>
              Coach notes
            </label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
          <div className="max-w-[160px]">
            <label className="text-sm block mb-1" style={{ color: "oklch(0.42 0.015 50)" }}>
              Default servings
            </label>
            <Input
              type="number"
              min={1}
              value={servingsDefault}
              onChange={(e) => setServingsDefault(Math.max(1, parseInt(e.target.value, 10) || 1))}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={showNutrition} onChange={(e) => setShowNutrition(e.target.checked)} />
            Show nutrition
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
            Published
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
            Featured
          </label>
          <div className="flex gap-2">
            <Button
              type="button"
              disabled={createPlan.isPending}
              onClick={() => {
                if (!title.trim()) return toast.error("Title is required");
                createPlan.mutate({
                  title: title.trim(),
                  description: description.trim() || null,
                  notes: notes.trim() || null,
                  servingsDefault,
                  showNutrition,
                  isPublished,
                  isFeatured,
                });
              }}
              style={{ background: "oklch(0.72 0.12 75)", color: "oklch(1 0 0)" }}
            >
              {createPlan.isPending ? <Loader2 className="animate-spin" size={16} /> : null}
              Create & build
            </Button>
            <Button type="button" variant="outline" onClick={resetCreate}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="py-12 flex justify-center" style={{ color: "oklch(0.72 0.12 75)" }}>
          <Loader2 className="animate-spin" />
        </div>
      ) : !plans?.length ? (
        <p className="text-sm" style={{ color: "oklch(0.52 0.015 50)" }}>
          No meal plans yet.
        </p>
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border bg-white"
              style={{ borderColor: "oklch(0.90 0.015 80)" }}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <p className="font-semibold text-sm" style={{ color: "oklch(0.20 0.015 50)" }}>
                    {plan.title}
                  </p>
                  <StatusBadge published={plan.isPublished} featured={plan.isFeatured} />
                </div>
                {plan.description && (
                  <p className="text-xs line-clamp-2" style={{ color: "oklch(0.52 0.015 50)" }}>
                    {plan.description}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => setBuildingId(plan.id)}>
                  Open builder
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={duplicatePlan.isPending}
                  onClick={() => duplicatePlan.mutate({ id: plan.id })}
                >
                  <Copy size={14} />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={deletePlan.isPending}
                  onClick={() => {
                    if (!confirm(`Delete “${plan.title}” and its assignments?`)) return;
                    deletePlan.mutate({ id: plan.id });
                  }}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
