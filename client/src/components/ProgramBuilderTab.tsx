import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, CheckCircle, Video, FileText, LayoutList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function ProgramBuilderTab() {
  const { data: modules, refetch: refetchModules } = trpc.reclaimHub.adminListModules.useQuery();
  const { data: submissions, refetch: refetchSubmissions } = trpc.reclaimHub.adminListSubmissions.useQuery();
  
  const createModule = trpc.reclaimHub.adminCreateModule.useMutation({
    onSuccess: () => { toast.success("Module created!"); refetchModules(); setEditingModule(null); },
    onError: (e) => toast.error(e.message),
  });

  const updateModule = trpc.reclaimHub.adminUpdateModule.useMutation({
    onSuccess: () => { toast.success("Module updated!"); refetchModules(); setEditingModule(null); },
    onError: (e) => toast.error(e.message),
  });

  const deleteModule = trpc.reclaimHub.adminDeleteModule.useMutation({
    onSuccess: () => { toast.success("Module deleted!"); refetchModules(); },
    onError: (e) => toast.error(e.message),
  });

  const updateFeedback = trpc.reclaimHub.adminUpdateFeedback.useMutation({
    onSuccess: () => { toast.success("Feedback sent!"); refetchSubmissions(); },
    onError: (e) => toast.error(e.message),
  });

  const [view, setView] = useState<"modules" | "submissions">("modules");
  const [editingModule, setEditingModule] = useState<any | null>(null);
  
  // Feedback state
  const [feedbackText, setFeedbackText] = useState<Record<number, string>>({});

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-bold text-2xl" style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.97 0.008 10)" }}>Reclaim Program Builder</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => setView("modules")}
            style={{ 
              background: view === "modules" ? "oklch(0.72 0.12 75)" : "transparent",
              borderColor: "oklch(0.72 0.12 75)",
              color: view === "modules" ? "oklch(0.18 0.02 160)" : "oklch(0.72 0.12 75)" 
            }}
          >
            Modules
          </Button>
          <Button 
            variant="outline"
            onClick={() => setView("submissions")}
            style={{ 
              background: view === "submissions" ? "oklch(0.72 0.12 75)" : "transparent",
              borderColor: "oklch(0.72 0.12 75)",
              color: view === "submissions" ? "oklch(0.18 0.02 160)" : "oklch(0.72 0.12 75)" 
            }}
          >
            Submissions
          </Button>
        </div>
      </div>

      {view === "modules" && (
        <div className="space-y-6">
          {!editingModule ? (
            <>
              <div className="flex justify-end">
                <Button 
                  onClick={() => setEditingModule({ title: "", description: "", content: "", videoUrl: "", pdfUrl: "", order: (modules?.length || 0) + 1, isPublished: false })}
                  style={{ background: "oklch(0.72 0.12 75)", color: "oklch(0.18 0.02 160)" }}
                  className="rounded-full font-bold"
                >
                  <Plus size={16} className="mr-2" /> Add Module
                </Button>
              </div>
              <div className="space-y-4">
                {(modules || []).map(mod => (
                  <div key={mod.id} className="p-5 rounded-xl flex items-center justify-between" style={{ background: "oklch(0.22 0.02 160)" }}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: "oklch(0.28 0.02 160)", color: "oklch(0.72 0.12 75)" }}>
                        {mod.order}
                      </div>
                      <div>
                        <h3 className="font-semibold" style={{ color: "oklch(0.97 0.008 10)" }}>{mod.title}</h3>
                        <p className="text-xs mt-1" style={{ color: "oklch(0.60 0.02 160)" }}>
                          {mod.isPublished ? "Published" : "Draft"} · {mod.videoUrl ? "Video Included" : "Text Only"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => setEditingModule(mod)} style={{ color: "oklch(0.72 0.12 75)" }}>
                        <Edit2 size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => { if(confirm("Delete this module?")) deleteModule.mutate({ id: mod.id }) }} style={{ color: "oklch(0.60 0.02 160)" }}>
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
                {modules?.length === 0 && <p className="text-sm" style={{ color: "oklch(0.55 0.02 160)" }}>No modules created yet.</p>}
              </div>
            </>
          ) : (
            <div className="p-6 rounded-xl space-y-4" style={{ background: "oklch(0.22 0.02 160)" }}>
              <h3 className="font-bold text-xl mb-4" style={{ color: "oklch(0.97 0.008 10)" }}>{editingModule.id ? "Edit Module" : "New Module"}</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label style={{ color: "oklch(0.80 0.02 160)" }}>Title</Label>
                  <Input 
                    value={editingModule.title} 
                    onChange={e => setEditingModule({...editingModule, title: e.target.value})} 
                    style={{ background: "oklch(0.18 0.02 160)", borderColor: "oklch(0.35 0.02 160)", color: "oklch(0.97 0.008 10)" }}
                  />
                </div>
                <div>
                  <Label style={{ color: "oklch(0.80 0.02 160)" }}>Order (1-6)</Label>
                  <Input 
                    type="number" 
                    value={editingModule.order} 
                    onChange={e => setEditingModule({...editingModule, order: parseInt(e.target.value)})} 
                    style={{ background: "oklch(0.18 0.02 160)", borderColor: "oklch(0.35 0.02 160)", color: "oklch(0.97 0.008 10)" }}
                  />
                </div>
              </div>

              <div>
                <Label style={{ color: "oklch(0.80 0.02 160)" }}>Description (Short intro)</Label>
                <Textarea 
                  value={editingModule.description || ""} 
                  onChange={e => setEditingModule({...editingModule, description: e.target.value})} 
                  style={{ background: "oklch(0.18 0.02 160)", borderColor: "oklch(0.35 0.02 160)", color: "oklch(0.97 0.008 10)" }}
                />
              </div>

              <div>
                <Label style={{ color: "oklch(0.80 0.02 160)" }}>Video URL (YouTube/Vimeo embed URL)</Label>
                <Input 
                  value={editingModule.videoUrl || ""} 
                  onChange={e => setEditingModule({...editingModule, videoUrl: e.target.value})} 
                  placeholder="https://www.youtube.com/embed/..."
                  style={{ background: "oklch(0.18 0.02 160)", borderColor: "oklch(0.35 0.02 160)", color: "oklch(0.97 0.008 10)" }}
                />
              </div>
              
              <div>
                <Label style={{ color: "oklch(0.80 0.02 160)" }}>Content (Rich text/HTML)</Label>
                <Textarea 
                  rows={8}
                  value={editingModule.content || ""} 
                  onChange={e => setEditingModule({...editingModule, content: e.target.value})} 
                  style={{ background: "oklch(0.18 0.02 160)", borderColor: "oklch(0.35 0.02 160)", color: "oklch(0.97 0.008 10)" }}
                />
              </div>

              <div>
                <Label style={{ color: "oklch(0.80 0.02 160)" }}>PDF Download URL (Optional)</Label>
                <Input 
                  value={editingModule.pdfUrl || ""} 
                  onChange={e => setEditingModule({...editingModule, pdfUrl: e.target.value})} 
                  style={{ background: "oklch(0.18 0.02 160)", borderColor: "oklch(0.35 0.02 160)", color: "oklch(0.97 0.008 10)" }}
                />
              </div>

              <div className="flex items-center gap-2 mt-4">
                <input 
                  type="checkbox" 
                  id="isPublished" 
                  checked={editingModule.isPublished}
                  onChange={e => setEditingModule({...editingModule, isPublished: e.target.checked})}
                />
                <Label htmlFor="isPublished" style={{ color: "oklch(0.80 0.02 160)" }}>Publish this module (Clients can see it when unlocked)</Label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: "oklch(0.30 0.02 160)" }}>
                <Button variant="outline" onClick={() => setEditingModule(null)} style={{ borderColor: "oklch(0.35 0.02 160)", color: "oklch(0.80 0.02 160)" }}>Cancel</Button>
                <Button 
                  onClick={() => {
                    if (editingModule.id) {
                      updateModule.mutate(editingModule);
                    } else {
                      createModule.mutate(editingModule);
                    }
                  }}
                  disabled={createModule.isPending || updateModule.isPending}
                  style={{ background: "oklch(0.72 0.12 75)", color: "oklch(0.18 0.02 160)" }}
                >
                  Save Module
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {view === "submissions" && (
        <div className="space-y-4">
          {(submissions || []).map((item: any) => (
            <div key={item.submission.id} className="p-5 rounded-xl" style={{ background: "oklch(0.22 0.02 160)" }}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold" style={{ color: "oklch(0.97 0.008 10)" }}>Module {item.module.order}: {item.module.title}</h3>
                  <p className="text-xs mt-1" style={{ color: "oklch(0.60 0.02 160)" }}>
                    Submitted on {new Date(item.submission.submittedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: item.submission.feedback ? "oklch(0.92 0.04 148)" : "oklch(0.35 0.08 20)", color: item.submission.feedback ? "oklch(0.38 0.10 148)" : "oklch(0.90 0.02 20)" }}>
                  {item.submission.feedback ? "Reviewed" : "Needs Review"}
                </div>
              </div>
              
              <div className="p-4 rounded-lg mb-4" style={{ background: "oklch(0.18 0.02 160)" }}>
                <p className="text-sm font-semibold mb-2" style={{ color: "oklch(0.72 0.12 75)" }}>Client Answer:</p>
                <p className="text-sm whitespace-pre-wrap" style={{ color: "oklch(0.90 0.01 160)" }}>
                  {item.submission.answer}
                </p>
              </div>

              <div>
                <Label style={{ color: "oklch(0.80 0.02 160)" }}>Your Feedback</Label>
                <Textarea 
                  placeholder="Leave encouraging feedback or notes for the client..."
                  value={feedbackText[item.submission.id] !== undefined ? feedbackText[item.submission.id] : (item.submission.feedback || "")}
                  onChange={e => setFeedbackText({...feedbackText, [item.submission.id]: e.target.value})}
                  className="mt-2"
                  style={{ background: "oklch(0.18 0.02 160)", borderColor: "oklch(0.35 0.02 160)", color: "oklch(0.97 0.008 10)" }}
                />
                <div className="mt-3 flex justify-end">
                  <Button 
                    size="sm"
                    onClick={() => updateFeedback.mutate({ submissionId: item.submission.id, feedback: feedbackText[item.submission.id] || "" })}
                    disabled={updateFeedback.isPending}
                    style={{ background: "oklch(0.72 0.12 75)", color: "oklch(0.18 0.02 160)" }}
                  >
                    Save & Send Feedback
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {submissions?.length === 0 && <p className="text-sm" style={{ color: "oklch(0.55 0.02 160)" }}>No assignment submissions yet.</p>}
        </div>
      )}
    </div>
  );
}
