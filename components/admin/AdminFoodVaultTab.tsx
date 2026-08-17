"use client";

import { useState } from "react";
import { AdminRecipesPanel } from "@/components/admin/food/AdminRecipesPanel";
import { AdminMealPlansPanel } from "@/components/admin/food/AdminMealPlansPanel";
import { AdminAssignmentsPanel } from "@/components/admin/food/AdminAssignmentsPanel";
import { AdminFatSecretImport } from "@/components/admin/food/AdminFatSecretImport";

type FoodInnerTab = "recipes" | "plans" | "assign" | "fatsecret";

const INNER_TABS: { id: FoodInnerTab; label: string }[] = [
  { id: "recipes", label: "Recipes" },
  { id: "plans", label: "Meal Plans" },
  { id: "assign", label: "Assign" },
  { id: "fatsecret", label: "FatSecret" },
];

export function AdminFoodVaultTab() {
  const [tab, setTab] = useState<FoodInnerTab>("recipes");
  const [editSlug, setEditSlug] = useState<string | null>(null);

  const openRecipe = (slug: string) => {
    setEditSlug(slug);
    setTab("recipes");
  };

  return (
    <div>
      <h2
        className="font-bold text-3xl mb-2"
        style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.20 0.015 50)" }}
      >
        Food Vault
      </h2>
      <p className="mb-8" style={{ color: "oklch(0.52 0.015 50)" }}>
        Recipes and weeks live here. Assign a plan under Assign. In-app coach messages show on Overview → Recent
        Messages (green &quot;In-app&quot; badge) — click one to reply.
      </p>

      <div
        className="flex flex-wrap gap-3 mb-8 border-b pb-4"
        style={{ borderColor: "oklch(0.90 0.015 80)" }}
      >
        {INNER_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className="px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm hover:shadow"
            style={{
              background: tab === t.id ? "oklch(0.72 0.12 75)" : "oklch(0.96 0.025 50)",
              color: tab === t.id ? "oklch(1 0 0)" : "oklch(0.42 0.015 50)",
              border: tab === t.id ? "none" : "1px solid oklch(0.90 0.015 80)",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "recipes" && (
        <AdminRecipesPanel
          initialEditSlug={editSlug}
          onInitialEditConsumed={() => setEditSlug(null)}
        />
      )}
      {tab === "plans" && <AdminMealPlansPanel />}
      {tab === "assign" && <AdminAssignmentsPanel />}
      {tab === "fatsecret" && <AdminFatSecretImport onEditInVault={openRecipe} />}
    </div>
  );
}
