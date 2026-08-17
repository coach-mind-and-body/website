"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Loader2, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import {
  MEAL_SLOT_LABELS,
  MEAL_SLOTS,
  RECIPE_TAGS,
  type MealSlot,
  type RecipeIngredient,
  type RecipeStep,
} from "@shared/food";

type IngredientRow = RecipeIngredient;
type StepRow = RecipeStep;

function asMealSlots(raw: string[] | undefined): MealSlot[] {
  return (raw ?? []).filter((s): s is MealSlot => (MEAL_SLOTS as readonly string[]).includes(s));
}

function parseNonNeg(value: string): number {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

const emptyIngredient = (): IngredientRow => ({ name: "", amount: "", unit: "", notes: "" });
const emptyStep = (): StepRow => ({ text: "" });

export function AdminRecipeEditor({
  slug,
  onCancel,
  onSaved,
}: {
  slug: string | null;
  onCancel: () => void;
  onSaved: (result: { id: number; slug: string }) => void;
}) {
  const isEdit = Boolean(slug);
  const { data: recipe, isLoading } = trpc.food.getRecipe.useQuery(
    { slug: slug ?? "" },
    { enabled: isEdit }
  );

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [mealSlots, setMealSlots] = useState<MealSlot[]>([]);
  const [prepMinutes, setPrepMinutes] = useState(0);
  const [cookMinutes, setCookMinutes] = useState(0);
  const [servings, setServings] = useState(1);
  const [calories, setCalories] = useState(0);
  const [protein, setProtein] = useState(0);
  const [carbs, setCarbs] = useState(0);
  const [fat, setFat] = useState(0);
  const [fiber, setFiber] = useState(0);
  const [ingredients, setIngredients] = useState<IngredientRow[]>([emptyIngredient()]);
  const [steps, setSteps] = useState<StepRow[]>([emptyStep()]);
  const [notes, setNotes] = useState("");
  const [showNutrition, setShowNutrition] = useState(true);
  const [isPublished, setIsPublished] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!recipe) return;
    setTitle(recipe.title);
    setDescription(recipe.description ?? "");
    setImageUrl(recipe.imageUrl ?? "");
    setTags(recipe.tags ?? []);
    setMealSlots(asMealSlots(recipe.mealSlots));
    setPrepMinutes(recipe.prepMinutes ?? 0);
    setCookMinutes(recipe.cookMinutes ?? 0);
    setServings(Math.max(1, recipe.servings ?? 1));
    setCalories(recipe.calories ?? 0);
    setProtein(recipe.protein ?? 0);
    setCarbs(recipe.carbs ?? 0);
    setFat(recipe.fat ?? 0);
    setFiber(recipe.fiber ?? 0);
    setIngredients(recipe.ingredients.length ? recipe.ingredients : [emptyIngredient()]);
    setSteps(recipe.steps.length ? recipe.steps : [emptyStep()]);
    setNotes(recipe.notes ?? "");
    setShowNutrition(recipe.showNutrition);
    setIsPublished(recipe.isPublished);
    setIsFeatured(recipe.isFeatured);
  }, [recipe]);

  const createRecipe = trpc.food.adminCreateRecipe.useMutation({
    onSuccess: (res) => {
      toast.success("Recipe created");
      onSaved(res);
    },
    onError: (e) => toast.error(e.message),
  });

  const updateRecipe = trpc.food.adminUpdateRecipe.useMutation({
    onSuccess: (res) => {
      toast.success("Recipe saved");
      onSaved(res);
    },
    onError: (e) => toast.error(e.message),
  });

  const uploadImage = trpc.food.adminUploadImage.useMutation({
    onError: (e) => toast.error(e.message),
  });

  const saving = createRecipe.isPending || updateRecipe.isPending;

  const handleUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const result = String(reader.result ?? "");
      const base64Data = result.includes(",") ? result.split(",")[1] ?? "" : result;
      if (!base64Data) {
        toast.error("Could not read that image");
        return;
      }
      try {
        const { url } = await uploadImage.mutateAsync({
          fileName: file.name,
          mimeType: file.type || "image/jpeg",
          base64Data,
        });
        setImageUrl(url);
        toast.success("Image uploaded");
      } catch {
        // onError toast already shown
      }
    };
    reader.readAsDataURL(file);
  };

  const payload = () => ({
    title: title.trim(),
    description: description.trim() || null,
    imageUrl: imageUrl.trim() || null,
    tags,
    mealSlots,
    prepMinutes,
    cookMinutes,
    servings: Math.max(1, servings),
    calories,
    protein,
    carbs,
    fat,
    fiber,
    ingredients: ingredients
      .map((i) => ({
        name: i.name.trim(),
        amount: i.amount.trim(),
        unit: i.unit.trim(),
        notes: i.notes?.trim() || undefined,
      }))
      .filter((i) => i.name),
    steps: steps.map((s) => ({ text: s.text.trim() })).filter((s) => s.text),
    notes: notes.trim() || null,
    showNutrition,
    isPublished,
    isFeatured,
  });

  const save = () => {
    if (!title.trim()) return toast.error("Title is required");
    const body = payload();
    if (isEdit && recipe) {
      updateRecipe.mutate({ id: recipe.id, ...body });
    } else {
      createRecipe.mutate(body);
    }
  };

  const toggleTag = (id: string) => {
    setTags((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  };

  const toggleSlot = (slot: MealSlot) => {
    setMealSlots((prev) => (prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]));
  };

  if (isEdit && isLoading) {
    return (
      <div className="py-12 flex justify-center" style={{ color: "oklch(0.72 0.12 75)" }}>
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (isEdit && !recipe && !isLoading) {
    return (
      <div className="space-y-3">
        <p className="text-sm" style={{ color: "oklch(0.52 0.015 50)" }}>
          Recipe not found.
        </p>
        <Button type="button" variant="outline" onClick={onCancel}>
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3
            className="font-bold text-2xl"
            style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.20 0.015 50)" }}
          >
            {isEdit ? "Edit recipe" : "New recipe"}
          </h3>
          {recipe?.slug && (
            <p className="text-xs mt-1" style={{ color: "oklch(0.52 0.015 50)" }}>
              /{recipe.slug}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={save}
            disabled={saving}
            style={{ background: "oklch(0.72 0.12 75)", color: "oklch(1 0 0)" }}
          >
            {saving ? <Loader2 className="animate-spin" size={16} /> : null}
            Save
          </Button>
        </div>
      </div>

      <section
        className="p-5 rounded-2xl border bg-white space-y-4"
        style={{ borderColor: "oklch(0.90 0.015 80)" }}
      >
        <Field label="Title">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Lemon herb chicken bowls"
          />
        </Field>
        <Field label="Description">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="A short coach note clients will see."
          />
        </Field>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
          <Field label="Image URL">
            <Input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://…"
            />
          </Field>
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
                e.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="outline"
              disabled={uploadImage.isPending}
              onClick={() => fileRef.current?.click()}
            >
              {uploadImage.isPending ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
              Upload
            </Button>
          </div>
        </div>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            className="w-28 h-28 object-cover rounded-xl border"
            style={{ borderColor: "oklch(0.90 0.015 80)" }}
          />
        ) : null}
      </section>

      <section
        className="p-5 rounded-2xl border bg-white space-y-3"
        style={{ borderColor: "oklch(0.90 0.015 80)" }}
      >
        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "oklch(0.52 0.015 50)" }}>
          Meal slots
        </p>
        <div className="flex flex-wrap gap-2">
          {MEAL_SLOTS.map((slot) => (
            <Chip key={slot} active={mealSlots.includes(slot)} onClick={() => toggleSlot(slot)}>
              {MEAL_SLOT_LABELS[slot]}
            </Chip>
          ))}
        </div>
        <p className="text-xs font-bold uppercase tracking-wide pt-2" style={{ color: "oklch(0.52 0.015 50)" }}>
          Tags
        </p>
        <div className="flex flex-wrap gap-2">
          {RECIPE_TAGS.map((t) => (
            <Chip key={t.id} active={tags.includes(t.id)} onClick={() => toggleTag(t.id)}>
              {t.label}
            </Chip>
          ))}
        </div>
      </section>

      <section
        className="p-5 rounded-2xl border bg-white"
        style={{ borderColor: "oklch(0.90 0.015 80)" }}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <NumField label="Prep (min)" value={prepMinutes} onChange={setPrepMinutes} />
          <NumField label="Cook (min)" value={cookMinutes} onChange={setCookMinutes} />
          <NumField label="Servings" value={servings} onChange={(n) => setServings(Math.max(1, n))} min={1} />
          <NumField label="Calories" value={calories} onChange={setCalories} />
          <NumField label="Protein (g)" value={protein} onChange={setProtein} />
          <NumField label="Carbs (g)" value={carbs} onChange={setCarbs} />
          <NumField label="Fat (g)" value={fat} onChange={setFat} />
          <NumField label="Fiber (g)" value={fiber} onChange={setFiber} />
        </div>
      </section>

      <section
        className="p-5 rounded-2xl border bg-white space-y-3"
        style={{ borderColor: "oklch(0.90 0.015 80)" }}
      >
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "oklch(0.52 0.015 50)" }}>
            Ingredients
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setIngredients((prev) => [...prev, emptyIngredient()])}
          >
            <Plus size={14} /> Add
          </Button>
        </div>
        <div className="space-y-2">
          {ingredients.map((ing, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center">
              <Input
                className="col-span-12 sm:col-span-4"
                value={ing.name}
                onChange={(e) =>
                  setIngredients((prev) => prev.map((row, idx) => (idx === i ? { ...row, name: e.target.value } : row)))
                }
                placeholder="Name"
              />
              <Input
                className="col-span-4 sm:col-span-2"
                value={ing.amount}
                onChange={(e) =>
                  setIngredients((prev) => prev.map((row, idx) => (idx === i ? { ...row, amount: e.target.value } : row)))
                }
                placeholder="Amt"
              />
              <Input
                className="col-span-4 sm:col-span-2"
                value={ing.unit}
                onChange={(e) =>
                  setIngredients((prev) => prev.map((row, idx) => (idx === i ? { ...row, unit: e.target.value } : row)))
                }
                placeholder="Unit"
              />
              <Input
                className="col-span-3 sm:col-span-3"
                value={ing.notes ?? ""}
                onChange={(e) =>
                  setIngredients((prev) => prev.map((row, idx) => (idx === i ? { ...row, notes: e.target.value } : row)))
                }
                placeholder="Notes"
              />
              <button
                type="button"
                className="col-span-1 flex justify-center"
                onClick={() =>
                  setIngredients((prev) => (prev.length <= 1 ? [emptyIngredient()] : prev.filter((_, idx) => idx !== i)))
                }
                aria-label="Remove ingredient"
              >
                <Trash2 size={16} style={{ color: "oklch(0.52 0.015 50)" }} />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section
        className="p-5 rounded-2xl border bg-white space-y-3"
        style={{ borderColor: "oklch(0.90 0.015 80)" }}
      >
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "oklch(0.52 0.015 50)" }}>
            Steps
          </p>
          <Button type="button" size="sm" variant="outline" onClick={() => setSteps((prev) => [...prev, emptyStep()])}>
            <Plus size={14} /> Add
          </Button>
        </div>
        <div className="space-y-2">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-2 items-start">
              <span
                className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold mt-1"
                style={{ background: "oklch(0.96 0.025 50)", color: "oklch(0.20 0.015 50)" }}
              >
                {i + 1}
              </span>
              <Textarea
                value={step.text}
                onChange={(e) =>
                  setSteps((prev) => prev.map((row, idx) => (idx === i ? { ...row, text: e.target.value } : row)))
                }
                rows={2}
                placeholder="What should they do?"
              />
              <button
                type="button"
                className="mt-2"
                onClick={() =>
                  setSteps((prev) => (prev.length <= 1 ? [emptyStep()] : prev.filter((_, idx) => idx !== i)))
                }
                aria-label="Remove step"
              >
                <Trash2 size={16} style={{ color: "oklch(0.52 0.015 50)" }} />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section
        className="p-5 rounded-2xl border bg-white space-y-4"
        style={{ borderColor: "oklch(0.90 0.015 80)" }}
      >
        <Field label="Coach notes (private to the vault)">
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
        </Field>
        <label className="flex items-center gap-2 text-sm" style={{ color: "oklch(0.20 0.015 50)" }}>
          <input type="checkbox" checked={showNutrition} onChange={(e) => setShowNutrition(e.target.checked)} />
          Show nutrition
        </label>
        <label className="flex items-center gap-2 text-sm" style={{ color: "oklch(0.20 0.015 50)" }}>
          <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
          Published
        </label>
        <label className="flex items-center gap-2 text-sm" style={{ color: "oklch(0.20 0.015 50)" }}>
          <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
          Featured
        </label>
      </section>

      <div className="flex justify-end gap-2 pb-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          onClick={save}
          disabled={saving}
          style={{ background: "oklch(0.72 0.12 75)", color: "oklch(1 0 0)" }}
        >
          {saving ? <Loader2 className="animate-spin" size={16} /> : null}
          Save
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="text-sm block mb-1" style={{ color: "oklch(0.42 0.015 50)" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
  min = 0,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
}) {
  return (
    <Field label={label}>
      <Input
        type="number"
        min={min}
        value={value}
        onChange={(e) => onChange(parseNonNeg(e.target.value))}
      />
    </Field>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-1 rounded-full text-xs font-bold transition-all"
      style={{
        background: active ? "oklch(0.72 0.12 75)" : "oklch(0.96 0.025 50)",
        color: active ? "oklch(1 0 0)" : "oklch(0.42 0.015 50)",
        border: active ? "none" : "1px solid oklch(0.90 0.015 80)",
      }}
    >
      {children}
    </button>
  );
}
