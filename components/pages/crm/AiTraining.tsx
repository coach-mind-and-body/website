import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Edit, Save, X, Brain } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Folder, ChevronLeft, CheckCircle, RefreshCcw, Sparkles, Settings } from "lucide-react";
import { toast } from "sonner";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

function renderMarkdown(text: string) {
  if (!text) return null;
  const blocks = text.split('\n\n');
  return blocks.map((block, i) => {
    if (block.startsWith('### ')) {
      return <h3 key={i} className="text-md font-bold mt-3 mb-1 text-slate-800">{block.replace('### ', '')}</h3>;
    }
    if (block.startsWith('**') && block.includes('**:')) {
      const parts = block.split('**:');
      return (
        <p key={i} className="text-sm mt-1">
          <strong>{parts[0].replace('**', '')}:</strong> {parts[1]}
        </p>
      );
    }
    if (block.startsWith('- ')) {
      const items = block.split('\n').map(l => l.replace('- ', ''));
      return (
        <ul key={i} className="list-disc pl-5 mt-1 text-sm space-y-1">
          {items.map((item, j) => <li key={j}>{item}</li>)}
        </ul>
      );
    }
    return <p key={i} className="text-sm mt-1 whitespace-pre-wrap">{block}</p>;
  });
}

const CATEGORIES = ["Policy", "Pricing", "Destinations", "Booking", "General"];

export default function AiTraining() {
  const { data: knowledge, refetch } = trpc.aiTraining.list.useQuery();
  const createMutation = trpc.aiTraining.create.useMutation({
    onSuccess: () => refetch(),
  });
  const updateMutation = trpc.aiTraining.update.useMutation({
    onSuccess: () => refetch(),
  });
  const deleteMutation = trpc.aiTraining.delete.useMutation({
    onSuccess: () => refetch(),
  });
  const triggerMutation = trpc.aiTraining.triggerExtraction.useMutation({
    onSuccess: (data) => {
      refetch();
      toast.success(`Training run complete! Extracted ${data.newFactsCount} new facts from ${data.processed} recent conversations.`);
    },
    onError: (err) => {
      toast.error(`Failed to run training: ${err.message}`);
    }
  });
  const { data: personaData, refetch: refetchPersona } = trpc.aiTraining.getPersona.useQuery();
  const setPersonaMutation = trpc.aiTraining.setPersona.useMutation({
    onSuccess: () => {
      refetchPersona();
      toast.success("AI Persona updated successfully!");
    }
  });
  const magicImportMutation = trpc.aiTraining.magicImport.useMutation({
    onSuccess: (data) => {
      refetch();
      toast.success(`Magic Import complete! Added ${data.count} new facts for review.`);
    },
    onError: (err) => {
      toast.error(`Import failed: ${err.message}`);
    }
  });

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const [isEditingPersona, setIsEditingPersona] = useState(false);
  const [personaText, setPersonaText] = useState("");
  
  const [isMagicImporting, setIsMagicImporting] = useState(false);
  const [magicNotes, setMagicNotes] = useState("");

  const pendingApprovals = knowledge?.filter((k: any) => !k.isActive) || [];
  
  // Group only active knowledge by category
  const activeKnowledge = knowledge?.filter((k: any) => k.isActive) || [];
  const groupedByCategory = activeKnowledge.reduce((acc: any, item: any) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});
  
  const allCategories = Array.from(new Set([...CATEGORIES, ...(knowledge?.map((k: any) => k.category) || [])]));

  const [form, setForm] = useState({
    category: "Policy",
    title: "",
    content: "",
    isActive: true,
  });

  const handleSave = async () => {
    if (!form.title || !form.content) return;
    
    if (editingId) {
      await updateMutation.mutateAsync({ id: editingId, ...form });
      setEditingId(null);
    } else {
      await createMutation.mutateAsync(form);
      setIsAdding(false);
    }
    setForm({ category: "Policy", title: "", content: "", isActive: true });
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setForm({
      category: item.category,
      title: item.title,
      content: item.content,
      isActive: item.isActive,
    });
    setIsAdding(false);
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsAdding(false);
    setForm({ category: "Policy", title: "", content: "", isActive: true });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Brain className="w-6 h-6 text-indigo-600" />
            AI Knowledge Base
          </h2>
          <p className="text-slate-500">Train the AI by adding specific business facts, rules, and policies.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            onClick={() => {
              setPersonaText(personaData?.persona || "");
              setIsEditingPersona(true);
            }}
          >
            <Settings className="w-4 h-4 mr-2 text-slate-600" />
            AI Persona
          </Button>
          <Button 
            variant="outline" 
            onClick={() => triggerMutation.mutate()}
            disabled={triggerMutation.isPending}
          >
            <RefreshCcw className={`w-4 h-4 mr-2 ${triggerMutation.isPending ? 'animate-spin' : ''}`} />
            {triggerMutation.isPending ? 'Running...' : 'Run Training Now'}
          </Button>
          <Button 
            variant="secondary"
            className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200"
            onClick={() => {
              setMagicNotes("");
              setIsMagicImporting(true);
            }}
          >
            <Sparkles className="w-4 h-4 mr-2 text-indigo-500" />
            Magic Import
          </Button>
          <Button onClick={() => {
            setIsAdding(true);
            setEditingId(null);
            setForm({ category: "Policy", title: "", content: "", isActive: true });
          }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Fact
          </Button>
        </div>
      </div>

      {(isAdding || editingId) && (
        <div className="bg-white border rounded-lg p-6 space-y-4 shadow-sm">
          <h3 className="text-lg font-semibold">{editingId ? "Edit Fact" : "New AI Fact"}</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select 
                value={form.category} 
                onValueChange={(val) => setForm({ ...form, category: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allCategories.map((c: string) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Title (for your reference)</label>
              <Input 
                value={form.title} 
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Disney Deposit"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Fact / Rule Content</label>
            <Textarea 
              value={form.content} 
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="e.g. All Disney World packages require a $200 refundable deposit."
              rows={4}
            />
            <p className="text-xs text-slate-500">This exact text will be injected into the AI's brain when answering user questions.</p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center space-x-2">
              <Switch 
                checked={form.isActive}
                onCheckedChange={(val) => setForm({ ...form, isActive: val })}
              />
              <span className="text-sm font-medium">Active (used by AI)</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!form.title || !form.content}>
                <Save className="w-4 h-4 mr-2" />
                Save Fact
              </Button>
            </div>
          </div>
        </div>
      )}

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="active" onClick={() => setSelectedCategory(null)}>Active Knowledge</TabsTrigger>
          <TabsTrigger value="pending">
            Pending Approvals
            {pendingApprovals.length > 0 && (
              <span className="ml-2 bg-red-100 text-red-700 py-0.5 px-2 rounded-full text-xs font-bold">
                {pendingApprovals.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {!selectedCategory ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.keys(groupedByCategory).length === 0 && !isAdding && (
                <div className="col-span-full text-center py-8 bg-slate-50 border border-dashed rounded-lg">
                  <Brain className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-slate-900">No AI Training Data</h3>
                  <p className="text-slate-500 mt-1 mb-4">Add facts and policies to make your AI smarter.</p>
                  <Button onClick={() => setIsAdding(true)}>
                    <Plus className="w-4 h-4 mr-2" /> Add First Fact
                  </Button>
                </div>
              )}
              {Object.keys(groupedByCategory).map((cat) => (
                <Card key={cat} className="cursor-pointer hover:border-indigo-300 transition-colors" onClick={() => setSelectedCategory(cat)}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Folder className="w-5 h-5 text-indigo-500" />
                      {cat}
                    </CardTitle>
                    <CardDescription>{groupedByCategory[cat].length} active rules</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-4 mb-4">
                <Button variant="outline" size="sm" onClick={() => setSelectedCategory(null)}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> Back to Categories
                </Button>
                <h3 className="text-xl font-bold">{selectedCategory} Rules</h3>
              </div>
              <Accordion type="multiple" className="w-full space-y-4">
                {groupedByCategory[selectedCategory]?.map((item: any) => (
                  <AccordionItem key={item.id} value={`item-${item.id}`} className="border rounded-lg bg-white px-4 data-[state=open]:border-indigo-200 data-[state=open]:shadow-sm">
                    <div className="flex gap-4 items-center">
                      <AccordionTrigger className="hover:no-underline flex-1 text-left text-base font-semibold text-slate-800">
                        {item.title}
                      </AccordionTrigger>
                      <div className="flex gap-2 pb-4 pt-4 shrink-0">
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleEdit(item); }}>
                          <Edit className="w-4 h-4 text-slate-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={(e) => {
                          e.stopPropagation();
                          if(confirm('Delete this fact?')) {
                            deleteMutation.mutate({ id: item.id });
                          }
                        }}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                    <AccordionContent className="border-t pt-4 pb-6 text-slate-600">
                      {renderMarkdown(item.content)}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {pendingApprovals.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 border border-dashed rounded-lg">
              <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-slate-900">You're all caught up!</h3>
              <p className="text-slate-500 mt-1">There are no pending facts to approve.</p>
            </div>
          ) : (
            <Accordion type="multiple" className="w-full space-y-4">
              {pendingApprovals.map((item: any) => (
                <AccordionItem key={item.id} value={`pending-${item.id}`} className="border border-orange-200 rounded-lg bg-orange-50/30 px-4 data-[state=open]:border-orange-300 data-[state=open]:shadow-sm">
                  <div className="flex gap-4 items-center">
                    <AccordionTrigger className="hover:no-underline flex-1 text-left">
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-800 text-xs font-bold rounded uppercase tracking-wider">
                          Needs Approval
                        </span>
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-medium rounded">
                          {item.category}
                        </span>
                        <span className="font-semibold text-slate-800">{item.title}</span>
                      </div>
                    </AccordionTrigger>
                    <div className="flex gap-2 pb-4 pt-4 shrink-0">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={(e) => {
                        e.stopPropagation();
                        updateMutation.mutate({ id: item.id, category: item.category, title: item.title, content: item.content, isActive: true });
                      }}>
                        <CheckCircle className="w-4 h-4 mr-1" /> Approve
                      </Button>
                      <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleEdit(item); }}>
                        <Edit className="w-4 h-4 mr-1" /> Edit
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={(e) => {
                        e.stopPropagation();
                        if(confirm('Delete this drafted fact?')) {
                          deleteMutation.mutate({ id: item.id });
                        }
                      }}>
                        <Trash2 className="w-4 h-4 mr-1" /> Discard
                      </Button>
                    </div>
                  </div>
                  <AccordionContent className="border-t border-orange-100 pt-4 pb-6 text-slate-600">
                    {renderMarkdown(item.content)}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </TabsContent>
      </Tabs>

      {/* AI Persona Modal */}
      <Dialog open={isEditingPersona} onOpenChange={setIsEditingPersona}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>AI Persona Settings</DialogTitle>
            <p className="text-sm text-slate-500">Edit the core instructions and personality for the AI.</p>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={personaText}
              onChange={(e) => setPersonaText(e.target.value)}
              className="min-h-[300px] font-mono text-sm"
              placeholder="You are a helpful travel assistant..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingPersona(false)}>Cancel</Button>
            <Button 
              onClick={() => {
                setPersonaMutation.mutate({ persona: personaText });
                setIsEditingPersona(false);
              }}
              disabled={setPersonaMutation.isPending}
            >
              {setPersonaMutation.isPending ? "Saving..." : "Save Persona"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Magic Import Modal */}
      <Dialog open={isMagicImporting} onOpenChange={setIsMagicImporting}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              Magic Import
            </DialogTitle>
            <p className="text-sm text-slate-500">
              Paste your raw brain-dump notes from a conference or training. The AI will automatically extract facts, format them, and add them to your Pending Approvals for review.
            </p>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={magicNotes}
              onChange={(e) => setMagicNotes(e.target.value)}
              className="min-h-[200px]"
              placeholder="e.g. Universal just announced Epic Universe opens May 22, 2025. Tickets go on sale next week..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMagicImporting(false)}>Cancel</Button>
            <Button 
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={async () => {
                if (!magicNotes.trim()) return;
                await magicImportMutation.mutateAsync({ notes: magicNotes });
                setIsMagicImporting(false);
              }}
              disabled={magicImportMutation.isPending || !magicNotes.trim()}
            >
              {magicImportMutation.isPending ? "Extracting Facts..." : "Import Notes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
