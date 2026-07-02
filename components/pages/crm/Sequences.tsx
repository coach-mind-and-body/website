import { useState } from "react";
import { RefreshCw, Plus, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface Sequence {
  id: number;
  name: string;
  triggerTagId: number | null;
  createdAt: Date | string;
  isActive: boolean;
  steps: { id: number; stepOrder: number; delayHours: number; messageBody: string }[];
}

import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Sequences() {
  const utils = trpc.useUtils();
  const { data: sequences = [], isLoading: loading } = trpc.crmAutomations.listSequences.useQuery();
  const { data: tags = [] } = trpc.crmAutomations.listTags.useQuery();

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Step Management
  const [editingSequence, setEditingSequence] = useState<Sequence | null>(null);
  const [delayHours, setDelayHours] = useState("");
  const [stepMessage, setStepMessage] = useState("");

  const createSequence = trpc.crmAutomations.createSequence.useMutation({
    onSuccess: () => {
      setShowForm(false);
      setName("");
      setSelectedTag("");
      setIsActive(true);
      utils.crmAutomations.listSequences.invalidate();
      toast.success("Sequence created — add steps and set Active when ready.");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateSequence = trpc.crmAutomations.updateSequence.useMutation({
    onSuccess: () => {
      utils.crmAutomations.listSequences.invalidate();
      toast.success("Sequence updated");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createSequence.mutate({
      name,
      triggerTagId: selectedTag ? parseInt(selectedTag) : undefined,
      isActive,
    });
  };

  const addStep = trpc.crmAutomations.addSequenceStep.useMutation({
    onSuccess: async (_data, variables) => {
      setDelayHours("");
      setStepMessage("");
      await utils.crmAutomations.listSequences.invalidate();
      const list = await utils.crmAutomations.listSequences.fetch();
      const refreshed = list.find(s => s.id === variables.sequenceId);
      if (refreshed) setEditingSequence(refreshed as Sequence);
      toast.success("Step added!");
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-transparent">
      <div className="p-6 border-b bg-white rounded-t-xl flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sequences</h1>
          <p className="text-muted-foreground mt-1 text-sm">Automated drip campaigns based on triggers.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          New Sequence
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-6 bg-white rounded-b-xl border border-t-0 shadow-sm">
        <div className="max-w-5xl space-y-8">
          {showForm && (
            <form onSubmit={handleCreate} className="bg-card border rounded-xl p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-semibold">Create Sequence</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sequence Name</label>
                  <Input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Flight Deal Giveaway Drip" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Trigger Tag</label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    value={selectedTag} 
                    onChange={e => setSelectedTag(e.target.value)}
                  >
                    <option value="">No tag trigger (Manual or API)</option>
                    {tags.map(t => <option key={t.id} value={t.id}>When added to: {t.name}</option>)}
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={e => setIsActive(e.target.checked)}
                  className="rounded border-input"
                />
                Start active (enrollments will send on schedule)
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" disabled={createSequence.isPending}>
                  {createSequence.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Create Framework
                </Button>
              </div>
            </form>
          )}

          <div className="space-y-4">
            {loading ? (
              <p>Loading sequences...</p>
            ) : sequences.length === 0 ? (
              <div className="text-center py-8 border border-dashed rounded-xl text-muted-foreground">
                <RefreshCw className="w-8 h-8 mx-auto mb-3 opacity-20" />
                <p>No sequences found. Create your first automated drip.</p>
              </div>
            ) : (
              <div className="border rounded-xl overflow-hidden bg-card">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-muted-foreground border-b">
                    <tr>
                      <th className="px-6 py-3 font-medium">Sequence</th>
                      <th className="px-6 py-3 font-medium">Status</th>
                      <th className="px-6 py-3 font-medium">Trigger</th>
                      <th className="px-6 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sequences.map(seq => (
                      <tr key={seq.id} className="border-b last:border-0">
                        <td className="px-6 py-4 font-medium">{seq.name}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                            ${seq.isActive ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' :
                              'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
                            {seq.isActive ? 'Active' : 'Draft'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {seq.triggerTagId ? (
                            <span className="flex items-center gap-1"><Target className="w-3 h-3"/> Tag: {tags.find(t => t.id === seq.triggerTagId)?.name || seq.triggerTagId}</span>
                          ) : (
                            <span className="text-slate-400">Manual / API</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <Button
                            variant={seq.isActive ? "secondary" : "default"}
                            size="sm"
                            disabled={updateSequence.isPending || !(seq.steps?.length)}
                            title={!(seq.steps?.length) ? "Add at least one step first" : undefined}
                            onClick={() => updateSequence.mutate({ id: seq.id, isActive: !seq.isActive })}
                          >
                            {seq.isActive ? "Pause" : "Activate"}
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setEditingSequence(seq as any)}>Edit Steps ({seq.steps?.length || 0})</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={!!editingSequence} onOpenChange={(o) => !o && setEditingSequence(null)}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto">
          {editingSequence && (
            <>
              <DialogHeader>
                <DialogTitle>Sequence: {editingSequence.name}</DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">Existing Steps</h3>
                  {editingSequence.steps && editingSequence.steps.length > 0 ? (
                    <div className="space-y-2 border rounded-md p-4 bg-slate-50">
                      {editingSequence.steps.sort((a,b) => a.stepOrder - b.stepOrder).map((s, i) => (
                        <div key={s.id} className="bg-white p-3 border rounded-md shadow-sm">
                          <div className="flex justify-between items-center mb-2">
                            <Badge variant="outline">Step {i + 1}</Badge>
                            <span className="text-xs text-slate-500">Wait {s.delayHours} hours</span>
                          </div>
                          <p className="text-sm text-slate-700 whitespace-pre-wrap">{s.messageBody}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 italic">No steps yet.</p>
                  )}
                </div>

                <div className="space-y-4 border-t pt-4">
                  <h3 className="font-semibold text-sm">Add New Step</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Delay (Hours from previous step)</label>
                      <Input type="number" min="0" value={delayHours} onChange={e => setDelayHours(e.target.value)} placeholder="e.g. 24" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Message Body</label>
                    <Textarea rows={4} value={stepMessage} onChange={e => setStepMessage(e.target.value)} placeholder="Type the automated message here..." />
                  </div>
                  <Button 
                    disabled={!delayHours || !stepMessage || addStep.isPending}
                    onClick={() => addStep.mutate({
                      sequenceId: editingSequence.id,
                      stepOrder: (editingSequence.steps?.length || 0) + 1,
                      delayHours: parseInt(delayHours),
                      messageBody: stepMessage
                    })}
                  >
                    {addStep.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                    Add Step
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
