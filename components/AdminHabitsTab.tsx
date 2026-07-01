import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function AdminHabitsTab() {
  const { data: templates, refetch } = trpc.habit.adminGetTemplates.useQuery();
  const createMutation = trpc.habit.adminCreateTemplate.useMutation({
    onSuccess: () => { toast.success("Habit created"); refetch(); setEditing(null); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.habit.adminUpdateTemplate.useMutation({
    onSuccess: () => { toast.success("Habit updated"); refetch(); setEditing(null); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.habit.adminDeleteTemplate.useMutation({
    onSuccess: () => { toast.success("Habit deleted"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const [editing, setEditing] = useState<{ id?: number; title: string; description: string | null; order: number; isActive: boolean } | null>(null);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-bold text-2xl" style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.20 0.015 50)" }}>Habit Templates</h2>
        <Button 
          onClick={() => setEditing({ title: "", description: "", order: (templates?.length || 0) + 1, isActive: true })}
          className="rounded-full font-bold"
          style={{ background: "oklch(0.72 0.12 75)", color: "oklch(1 0 0)" }}
        >
          <Plus size={16} className="mr-2" /> New Template
        </Button>
      </div>

      {editing && (
        <div className="rounded-xl p-6 mb-6 border" style={{ background: "oklch(1 0 0)", borderColor: "oklch(0.90 0.015 80)", color: "oklch(0.20 0.015 50)" }}>
          <h3 className="font-bold mb-4">{editing.id ? "Edit Habit" : "New Habit"}</h3>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input 
                value={editing.title} 
                onChange={e => setEditing({ ...editing, title: e.target.value })} 
                className="border"
                style={{ background: "oklch(0.985 0.008 80)", borderColor: "oklch(0.90 0.015 80)" }}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea 
                value={editing.description || ""} 
                onChange={e => setEditing({ ...editing, description: e.target.value })} 
                className="border"
                style={{ background: "oklch(0.985 0.008 80)", borderColor: "oklch(0.90 0.015 80)" }}
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label>Order</Label>
                <Input 
                  type="number" 
                  value={editing.order} 
                  onChange={e => setEditing({ ...editing, order: parseInt(e.target.value) || 0 })} 
                  className="border"
                  style={{ background: "oklch(0.985 0.008 80)", borderColor: "oklch(0.90 0.015 80)" }}
                />
              </div>
              <div className="flex items-center gap-2 mt-6">
                <input 
                  type="checkbox" 
                  id="isActive" 
                  checked={editing.isActive} 
                  onChange={e => setEditing({ ...editing, isActive: e.target.checked })} 
                  className="w-4 h-4 rounded border-gray-300"
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              <Button onClick={() => {
                if (editing.id) {
                  updateMutation.mutate({ id: editing.id, title: editing.title, description: editing.description ?? undefined, order: editing.order, isActive: editing.isActive });
                } else {
                  createMutation.mutate({ title: editing.title, description: editing.description ?? undefined, order: editing.order, isActive: editing.isActive });
                }
              }} disabled={!editing.title || createMutation.isPending || updateMutation.isPending}
              className="bg-[oklch(0.72_0.12_75)] hover:bg-[oklch(0.68_0.12_75)] text-white">
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {(templates || []).map(t => (
          <div key={t.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl" style={{ background: "oklch(1 0 0)" }}>
            <div>
              <p className="font-bold text-lg" style={{ color: "oklch(0.20 0.015 50)" }}>{t.title} {!t.isActive && "(Inactive)"}</p>
              {t.description && <p className="text-sm" style={{ color: "oklch(0.52 0.015 50)" }}>{t.description}</p>}
            </div>
            <div className="flex gap-2 mt-3 sm:mt-0">
              <Button variant="ghost" size="sm" onClick={() => setEditing({ id: t.id, title: t.title, description: t.description, order: t.order, isActive: t.isActive })} style={{ color: "oklch(0.42 0.015 50)" }}><Edit2 size={16} /></Button>
              <Button variant="ghost" size="sm" onClick={() => { if (confirm("Delete this habit template?")) deleteMutation.mutate({ id: t.id }); }}><Trash2 size={16} className="text-red-500 hover:text-red-700" /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
