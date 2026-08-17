"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Check,
  Loader2,
  Plus,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { usePageTitle } from "@/hooks/usePageTitle";
import FoodHubNav from "@/components/habit/FoodHubNav";
import {
  SHOP_AISLES,
  SHOP_AISLE_LABELS,
  type ShopAisle,
} from "@shared/food";

const FOREST = "#2d3b2d";
const GOLD = "#c9a96e";
const BORDER = "#f0e8e4";
const CREAM = "#faf5f5";

function aisleOf(raw: string): ShopAisle {
  return (SHOP_AISLES as readonly string[]).includes(raw)
    ? (raw as ShopAisle)
    : "other";
}

function formatQty(amount: string | null, unit: string | null): string {
  return [amount, unit].filter(Boolean).join(" ").trim();
}

export default function ShopClient() {
  usePageTitle({
    title: "Shop | Mind & Body Reset",
    description: "Your shopping list, grouped by aisle.",
  });

  const { isAuthenticated, loading: authLoading } = useAuth();
  const utils = trpc.useUtils();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");

  const { data: items, isLoading } = trpc.food.getShoppingList.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: myPlan } = trpc.food.getMyMealPlan.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const setChecked = trpc.food.setShoppingChecked.useMutation({
    onSuccess: () => void utils.food.getShoppingList.invalidate(),
    onError: (e) => toast.error(e.message),
  });
  const addItem = trpc.food.addShoppingItem.useMutation({
    onSuccess: () => {
      setName("");
      setAmount("");
      void utils.food.getShoppingList.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const removeItem = trpc.food.removeShoppingItem.useMutation({
    onSuccess: () => void utils.food.getShoppingList.invalidate(),
    onError: (e) => toast.error(e.message),
  });
  const clearChecked = trpc.food.clearCheckedShopping.useMutation({
    onSuccess: () => {
      toast.success("Checked items cleared");
      void utils.food.getShoppingList.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const regenerate = trpc.food.regenerateShoppingList.useMutation({
    onSuccess: (res) => {
      toast.success(
        res.count ? `Added ${res.count} items from your week` : "List rebuilt"
      );
      void utils.food.getShoppingList.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const list = items ?? [];
  const remaining = list.filter((i) => !i.isChecked).length;
  const checkedCount = list.length - remaining;

  const grouped = useMemo(() => {
    return SHOP_AISLES.map((aisle) => ({
      aisle,
      label: SHOP_AISLE_LABELS[aisle],
      items: list.filter((i) => aisleOf(i.aisle) === aisle),
    })).filter((g) => g.items.length > 0);
  }, [list]);

  const onAdd = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    addItem.mutate({
      name: trimmed,
      amount: amount.trim() || undefined,
    });
  };

  return (
    <div className="min-h-screen text-gray-900" style={{ background: CREAM }}>
      <div className="max-w-lg mx-auto px-4 pt-5">
        <FoodHubNav />

        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#8a9a8a]">
              Groceries
            </p>
            <h1
              className="text-2xl font-bold"
              style={{ fontFamily: "'Cormorant Garamond', serif", color: FOREST }}
            >
              Shop
            </h1>
            {isAuthenticated && list.length > 0 ? (
              <p className="text-xs text-[#6b7a6b] mt-0.5">
                {remaining} {remaining === 1 ? "item" : "items"} left
              </p>
            ) : null}
          </div>
          {isAuthenticated && checkedCount > 0 ? (
            <button
              type="button"
              onClick={() => clearChecked.mutate()}
              disabled={clearChecked.isPending}
              className="inline-flex items-center gap-1 text-xs font-bold shrink-0 mt-2"
              style={{ color: "#6b7a6b" }}
            >
              <Trash2 size={13} />
              Clear checked
            </button>
          ) : null}
        </div>

        {authLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin" size={28} style={{ color: GOLD }} />
          </div>
        ) : !isAuthenticated ? (
          <div
            className="bg-white rounded-3xl border p-8 text-center"
            style={{ borderColor: BORDER }}
          >
            <ShoppingCart size={28} className="mx-auto mb-3" style={{ color: GOLD }} />
            <p
              className="text-lg font-bold mb-1"
              style={{ fontFamily: "'Cormorant Garamond', serif", color: FOREST }}
            >
              Your list lives with your account
            </p>
            <p className="text-sm text-[#6b7a6b] leading-relaxed mb-4">
              Sign in to build a shopping list from this week's meals.
            </p>
            <Link
              href="/login?returnTo=/habit-tracker/shop"
              className="inline-block rounded-full px-5 py-2.5 text-sm font-bold text-white"
              style={{ background: FOREST }}
            >
              Sign in
            </Link>
          </div>
        ) : (
          <>
            <form
              className="flex gap-2 mb-4"
              onSubmit={(e) => {
                e.preventDefault();
                onAdd();
              }}
            >
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Add something…"
                className="flex-1 min-w-0 bg-white border rounded-full px-3.5 py-2.5 text-sm outline-none"
                style={{ borderColor: BORDER, color: FOREST }}
              />
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Qty"
                className="w-16 bg-white border rounded-full px-2.5 py-2.5 text-sm outline-none text-center"
                style={{ borderColor: BORDER, color: FOREST }}
              />
              <button
                type="submit"
                disabled={addItem.isPending || !name.trim()}
                aria-label="Add item"
                className="w-11 h-11 rounded-full text-white flex items-center justify-center shrink-0 disabled:opacity-50"
                style={{ background: FOREST }}
              >
                {addItem.isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Plus size={18} />
                )}
              </button>
            </form>

            {isLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="animate-spin" size={28} style={{ color: GOLD }} />
              </div>
            ) : list.length === 0 ? (
              <div
                className="bg-white rounded-3xl border p-8 text-center"
                style={{ borderColor: BORDER }}
              >
                <ShoppingCart size={28} className="mx-auto mb-3" style={{ color: GOLD }} />
                <p
                  className="text-lg font-bold mb-1"
                  style={{ fontFamily: "'Cormorant Garamond', serif", color: FOREST }}
                >
                  The cart is empty
                </p>
                <p className="text-sm text-[#6b7a6b] leading-relaxed mb-4">
                  {myPlan?.id
                    ? "Build it from this week's meals, or add a few things as they come to mind."
                    : "Add a few things as they come to mind — or wait for Lee Anne to assign a week."}
                </p>
                {myPlan?.id ? (
                  <button
                    type="button"
                    onClick={() => regenerate.mutate({ mealPlanId: myPlan.id })}
                    disabled={regenerate.isPending}
                    className="inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-bold text-white disabled:opacity-70"
                    style={{ background: FOREST }}
                  >
                    {regenerate.isPending ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <ShoppingCart size={14} />
                    )}
                    Generate from my meal plan
                  </button>
                ) : (
                  <Link
                    href="/habit-tracker/meal-plan"
                    className="text-xs font-bold underline"
                    style={{ color: GOLD }}
                  >
                    See this week
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {grouped.map((group) => (
                  <section
                    key={group.aisle}
                    className="bg-white rounded-3xl border shadow-sm overflow-hidden"
                    style={{ borderColor: BORDER }}
                  >
                    <h2
                      className="px-4 pt-3.5 pb-2 text-[10px] font-bold uppercase tracking-widest"
                      style={{ color: GOLD }}
                    >
                      {group.label}
                    </h2>
                    <ul>
                      {group.items.map((item) => {
                        const qty = formatQty(item.amount, item.unit);
                        return (
                          <li
                            key={item.id}
                            className="flex items-center gap-2.5 px-3 py-2.5 border-t"
                            style={{ borderColor: BORDER }}
                          >
                            <button
                              type="button"
                              aria-label={item.isChecked ? "Uncheck" : "Check off"}
                              onClick={() =>
                                setChecked.mutate({
                                  id: item.id,
                                  checked: !item.isChecked,
                                })
                              }
                              className="w-6 h-6 rounded-md border flex items-center justify-center shrink-0"
                              style={{
                                borderColor: item.isChecked ? FOREST : BORDER,
                                background: item.isChecked ? FOREST : "white",
                              }}
                            >
                              {item.isChecked ? (
                                <Check size={14} color="white" strokeWidth={3} />
                              ) : null}
                            </button>
                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-sm font-medium ${
                                  item.isChecked ? "line-through text-gray-400" : ""
                                }`}
                                style={item.isChecked ? undefined : { color: FOREST }}
                              >
                                {item.name}
                              </p>
                              {qty ? (
                                <p
                                  className={`text-[11px] ${
                                    item.isChecked ? "line-through text-gray-300" : "text-[#8a9a8a]"
                                  }`}
                                >
                                  {qty}
                                </p>
                              ) : null}
                            </div>
                            <button
                              type="button"
                              aria-label={`Remove ${item.name}`}
                              onClick={() => removeItem.mutate({ id: item.id })}
                              className="w-7 h-7 rounded-full flex items-center justify-center text-gray-300 hover:text-gray-500"
                            >
                              <X size={14} />
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
