"use client";

import { useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import FatSecretAttribution from "@/components/habit/FatSecretAttribution";

export function AdminFatSecretImport({
  onEditInVault,
}: {
  onEditInVault: (slug: string) => void;
}) {
  const utils = trpc.useUtils();
  const { data: status, isLoading: statusLoading } = trpc.food.fatsecretStatus.useQuery();
  const configured = Boolean(status?.configured);

  const [q, setQ] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [page, setPage] = useState(0);
  const [importingId, setImportingId] = useState<string | null>(null);

  useEffect(() => {
    setPage(0);
  }, [submitted]);

  const { data, isFetching, isError, error } = trpc.food.fatsecretSearchRecipes.useQuery(
    { q: submitted, page },
    { enabled: configured && submitted.length > 0 }
  );

  const importRecipe = trpc.food.fatsecretImportRecipe.useMutation({
    onSuccess: (res, vars) => {
      utils.food.listRecipes.invalidate();
      const already = "already" in res && res.already;
      toast.success(already ? "Already in the vault" : vars.publish ? "Imported and published" : "Imported as a draft", {
        action: {
          label: "Edit in vault",
          onClick: () => onEditInVault(res.slug),
        },
      });
    },
    onError: (e) => toast.error(e.message),
    onSettled: () => setImportingId(null),
  });

  const runSearch = () => {
    const next = q.trim();
    if (!next) return toast.error("Enter a search term");
    setSubmitted(next);
  };

  if (statusLoading) {
    return (
      <div className="py-12 flex justify-center" style={{ color: "oklch(0.72 0.12 75)" }}>
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (!configured) {
    return (
      <div
        className="p-6 rounded-2xl border"
        style={{ background: "oklch(0.96 0.025 50)", borderColor: "oklch(0.90 0.015 80)" }}
      >
        <h3
          className="font-bold text-2xl mb-2"
          style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.20 0.015 50)" }}
        >
          FatSecret is not configured
        </h3>
        <p className="text-sm max-w-xl" style={{ color: "oklch(0.52 0.015 50)" }}>
          Add <code className="font-semibold">FATSECRET_CLIENT_ID</code> and{" "}
          <code className="font-semibold">FATSECRET_CONSUMER_SECRET</code> (OAuth 1.0) to the server environment, then reload this tab
          to search and import recipes.
        </p>
      </div>
    );
  }

  const recipes = data?.recipes ?? [];
  const total = data?.total ?? 0;
  const pageSize = 20;
  const canPrev = page > 0;
  const canNext = (page + 1) * pageSize < total;

  return (
    <div>
      <h3
        className="font-bold text-2xl mb-1"
        style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.20 0.015 50)" }}
      >
        FatSecret import
      </h3>
      <p className="text-sm mb-6" style={{ color: "oklch(0.52 0.015 50)" }}>
        Search the FatSecret recipe library and pull a copy into the vault. You can edit anything after import.
      </p>

      <form
        className="flex flex-wrap gap-2 mb-6"
        onSubmit={(e) => {
          e.preventDefault();
          runSearch();
        }}
      >
        <div className="relative flex-1 min-w-[220px]">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "oklch(0.52 0.015 50)" }}
          />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="e.g. high protein chicken"
            className="pl-9"
          />
        </div>
        <Button type="submit" style={{ background: "oklch(0.72 0.12 75)", color: "oklch(1 0 0)" }}>
          Search
        </Button>
      </form>

      {isError && (
        <p className="text-sm mb-4" style={{ color: "oklch(0.45 0.12 25)" }}>
          {error.message}
        </p>
      )}

      {isFetching && !data ? (
        <div className="py-12 flex justify-center" style={{ color: "oklch(0.72 0.12 75)" }}>
          <Loader2 className="animate-spin" />
        </div>
      ) : submitted && !isFetching && recipes.length === 0 ? (
        <p className="text-sm" style={{ color: "oklch(0.52 0.015 50)" }}>
          No FatSecret recipes matched “{submitted}”.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recipes.map((recipe) => {
              const busy = importingId === recipe.recipeId;
              return (
                <div
                  key={recipe.recipeId}
                  className="rounded-2xl border bg-white overflow-hidden flex flex-col"
                  style={{ borderColor: "oklch(0.90 0.015 80)" }}
                >
                  <div className="h-36" style={{ background: "oklch(0.96 0.025 50)" }}>
                    {recipe.imageUrl ? (
                      <img src={recipe.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : null}
                  </div>
                  <div className="p-4 flex-1 flex flex-col gap-2">
                    <h4 className="font-bold text-sm" style={{ color: "oklch(0.20 0.015 50)" }}>
                      {recipe.name}
                    </h4>
                    {recipe.description && (
                      <p className="text-xs line-clamp-2" style={{ color: "oklch(0.52 0.015 50)" }}>
                        {recipe.description}
                      </p>
                    )}
                    <p className="text-[11px] font-semibold" style={{ color: "oklch(0.42 0.015 50)" }}>
                      {recipe.calories} cal · {recipe.protein}p · {recipe.carbs}c · {recipe.fat}f
                    </p>
                    {recipe.ingredients.length > 0 && (
                      <p className="text-[11px] line-clamp-2" style={{ color: "oklch(0.52 0.015 50)" }}>
                        {recipe.ingredients.slice(0, 6).join(", ")}
                        {recipe.ingredients.length > 6 ? "…" : ""}
                      </p>
                    )}
                    <div className="mt-auto flex flex-wrap gap-2 pt-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() => {
                          setImportingId(recipe.recipeId);
                          importRecipe.mutate({ recipeId: recipe.recipeId });
                        }}
                      >
                        {busy && !importRecipe.variables?.publish ? <Loader2 className="animate-spin" size={14} /> : null}
                        Import
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        disabled={busy}
                        onClick={() => {
                          setImportingId(recipe.recipeId);
                          importRecipe.mutate({ recipeId: recipe.recipeId, publish: true });
                        }}
                        style={{ background: "oklch(0.72 0.12 75)", color: "oklch(1 0 0)" }}
                      >
                        {busy && importRecipe.variables?.publish ? <Loader2 className="animate-spin" size={14} /> : null}
                        Import & publish
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {total > pageSize && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-xs" style={{ color: "oklch(0.52 0.015 50)" }}>
                Page {page + 1} · {total} results
              </p>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="outline" disabled={!canPrev || isFetching} onClick={() => setPage((p) => Math.max(0, p - 1))}>
                  Previous
                </Button>
                <Button type="button" size="sm" variant="outline" disabled={!canNext || isFetching} onClick={() => setPage((p) => p + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <FatSecretAttribution show={configured} />
    </div>
  );
}
