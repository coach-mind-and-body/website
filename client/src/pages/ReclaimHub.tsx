import { useState, useEffect } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, PlayCircle, FileText, CheckCircle, ArrowLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { BRAND } from "../../../shared/brand";
import { Link } from "wouter";

export default function ReclaimHub() {
  usePageTitle({
    title: "Reclaim Hub | Mind and Body Reset",
    description: "Access your R.E.C.L.A.I.M. modules, workshops, and assignments.",
  });

  const { user, isAuthenticated, loading } = useAuth();
  
  const { data, refetch, isLoading } = trpc.reclaimHub.getModules.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const submitAssignment = trpc.reclaimHub.submitAssignment.useMutation({
    onSuccess: () => {
      toast.success("Assignment submitted successfully!");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [loading, isAuthenticated]);

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "oklch(0.98 0.01 75)" }}>
        <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "oklch(0.38 0.08 148)" }} />
      </div>
    );
  }

  const modules = data?.modules || [];
  const progress = data?.progress || [];
  const assignments = data?.assignments || [];
  const submissions = data?.submissions || [];

  const selectedModule = modules.find(m => m.id === selectedModuleId);
  const selectedAssignments = assignments.filter(a => a.moduleId === selectedModuleId);

  // Initialize answers from existing submissions when a module is selected
  useEffect(() => {
    if (selectedModuleId) {
      const newAnswers: Record<number, string> = {};
      selectedAssignments.forEach(a => {
        const sub = submissions.find(s => s.assignmentId === a.id);
        if (sub) newAnswers[a.id] = sub.answer;
      });
      setAnswers(newAnswers);
    }
  }, [selectedModuleId, data]);

  const handleAnswerChange = (assignmentId: number, text: string) => {
    setAnswers(prev => ({ ...prev, [assignmentId]: text }));
  };

  const isUnlocked = (moduleId: number) => {
    return progress.some(p => p.moduleId === moduleId);
  };

  return (
    <div className="min-h-screen font-sans" style={{ background: "oklch(0.98 0.01 75)" }}>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b" style={{ borderColor: "oklch(0.92 0.02 75)" }}>
        <div className="container max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/portal" className="flex items-center gap-3 group">
            <img src={BRAND.logoUrl} alt={BRAND.name} className="w-10 h-10 rounded-full object-cover shadow-sm group-hover:scale-105 transition-transform" />
            <div>
              <span className="block font-bold text-lg leading-tight" style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.28 0.05 148)" }}>
                Reclaim Hub
              </span>
              <span className="block text-xs" style={{ color: "oklch(0.55 0.02 75)" }}>Client Portal</span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm" style={{ background: "oklch(0.38 0.08 148)", color: "white" }}>
              {user?.name?.[0]?.toUpperCase() ?? "C"}
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-5xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {!selectedModule ? (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-12 text-center">
                <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.28 0.05 148)" }}>
                  Your Reclaim Journey
                </h1>
                <p className="text-lg max-w-2xl mx-auto" style={{ color: "oklch(0.45 0.02 75)" }}>
                  Explore your modules, complete assignments, and track your progress through the 6-session Mind & Body Reset program.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {modules.map((mod, index) => {
                  const unlocked = isUnlocked(mod.id);
                  const isCompleted = progress.find(p => p.moduleId === mod.id)?.completedAt !== null && unlocked;

                  return (
                    <motion.div
                      key={mod.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className={`relative rounded-2xl overflow-hidden transition-all duration-300 ${unlocked ? 'cursor-pointer hover:shadow-xl hover:-translate-y-1' : 'opacity-80'}`}
                      style={{ 
                        background: unlocked ? "white" : "oklch(0.96 0.01 75)",
                        border: "1px solid",
                        borderColor: unlocked ? "oklch(0.85 0.04 148)" : "oklch(0.92 0.02 75)",
                      }}
                      onClick={() => unlocked && setSelectedModuleId(mod.id)}
                    >
                      <div className="h-3" style={{ background: unlocked ? "oklch(0.38 0.08 148)" : "oklch(0.80 0.02 75)" }} />
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full" style={{ background: unlocked ? "oklch(0.95 0.04 148)" : "oklch(0.90 0.02 75)", color: unlocked ? "oklch(0.38 0.08 148)" : "oklch(0.55 0.02 75)" }}>
                            Module {mod.order}
                          </span>
                          {!unlocked && <Lock size={18} style={{ color: "oklch(0.65 0.02 75)" }} />}
                          {isCompleted && <CheckCircle size={18} style={{ color: "oklch(0.60 0.12 148)" }} />}
                        </div>
                        <h3 className="text-xl font-bold mb-2 leading-tight" style={{ fontFamily: "'Cormorant Garamond', serif", color: unlocked ? "oklch(0.28 0.05 148)" : "oklch(0.55 0.02 75)" }}>
                          {mod.title}
                        </h3>
                        <p className="text-sm line-clamp-3 mb-6" style={{ color: "oklch(0.45 0.02 75)" }}>
                          {mod.description || "Unlock this module after your coaching session to view the content."}
                        </p>
                        <div className="flex items-center justify-between mt-auto">
                          {unlocked ? (
                            <span className="text-sm font-semibold flex items-center gap-2" style={{ color: "oklch(0.60 0.12 75)" }}>
                              <PlayCircle size={16} /> Enter Workshop
                            </span>
                          ) : (
                            <span className="text-sm italic" style={{ color: "oklch(0.55 0.02 75)" }}>
                              Unlocks after session {mod.order}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-3xl mx-auto"
            >
              <button 
                onClick={() => setSelectedModuleId(null)}
                className="flex items-center gap-2 mb-8 text-sm font-semibold hover:opacity-70 transition-opacity"
                style={{ color: "oklch(0.45 0.02 75)" }}
              >
                <ArrowLeft size={16} /> Back to Modules
              </button>

              <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl shadow-black/5 border" style={{ borderColor: "oklch(0.92 0.02 75)" }}>
                <div className="mb-8">
                  <span className="text-sm font-bold uppercase tracking-widest px-3 py-1 rounded-full inline-block mb-4" style={{ background: "oklch(0.95 0.04 148)", color: "oklch(0.38 0.08 148)" }}>
                    Module {selectedModule.order}
                  </span>
                  <h1 className="text-3xl md:text-5xl font-bold mb-4" style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.28 0.05 148)" }}>
                    {selectedModule.title}
                  </h1>
                  {selectedModule.description && (
                    <p className="text-lg" style={{ color: "oklch(0.45 0.02 75)" }}>{selectedModule.description}</p>
                  )}
                </div>

                {selectedModule.videoUrl && (
                  <div className="aspect-video w-full rounded-2xl overflow-hidden mb-12 shadow-lg bg-black/5">
                    <iframe 
                      src={selectedModule.videoUrl} 
                      className="w-full h-full border-0" 
                      allow="autoplay; fullscreen; picture-in-picture" 
                      allowFullScreen 
                    />
                  </div>
                )}

                {selectedModule.content && (
                  <div className="prose prose-lg prose-stone max-w-none mb-12" dangerouslySetInnerHTML={{ __html: selectedModule.content }} />
                )}

                {selectedModule.pdfUrl && (
                  <div className="mb-12 p-6 rounded-2xl flex items-center justify-between" style={{ background: "oklch(0.97 0.02 75)", border: "1px solid oklch(0.90 0.02 75)" }}>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white shadow-sm text-red-500">
                        <FileText size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg" style={{ color: "oklch(0.28 0.05 148)" }}>Module Guide & Worksheets</h4>
                        <p className="text-sm" style={{ color: "oklch(0.45 0.02 75)" }}>Download the companion PDF for this module.</p>
                      </div>
                    </div>
                    <a 
                      href={selectedModule.pdfUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-6 py-3 rounded-full font-bold text-sm transition-transform hover:scale-105 shadow-md"
                      style={{ background: "oklch(0.38 0.08 148)", color: "white" }}
                    >
                      Download PDF
                    </a>
                  </div>
                )}

                {selectedAssignments.length > 0 && (
                  <div className="mt-16 pt-12 border-t" style={{ borderColor: "oklch(0.92 0.02 75)" }}>
                    <h2 className="text-2xl md:text-3xl font-bold mb-8" style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.28 0.05 148)" }}>
                      Reflection & Assignments
                    </h2>
                    
                    <div className="space-y-10">
                      {selectedAssignments.map((assignment, idx) => {
                        const submission = submissions.find(s => s.assignmentId === assignment.id);
                        
                        return (
                          <div key={assignment.id} className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border" style={{ borderColor: "oklch(0.92 0.02 75)" }}>
                            <div className="flex gap-4 mb-6">
                              <div className="w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center font-bold text-sm mt-1" style={{ background: "oklch(0.95 0.04 148)", color: "oklch(0.38 0.08 148)" }}>
                                {idx + 1}
                              </div>
                              <p className="text-lg font-medium leading-relaxed" style={{ color: "oklch(0.28 0.05 148)" }}>
                                {assignment.question}
                              </p>
                            </div>
                            
                            <Textarea 
                              rows={5}
                              placeholder="Type your reflection here..."
                              value={answers[assignment.id] || ""}
                              onChange={e => handleAnswerChange(assignment.id, e.target.value)}
                              className="text-base resize-y p-4 rounded-xl border focus:ring-2"
                              style={{ borderColor: "oklch(0.85 0.02 75)", color: "oklch(0.28 0.05 148)" }}
                            />
                            
                            <div className="mt-4 flex items-center justify-between">
                              {submission ? (
                                <p className="text-xs font-semibold flex items-center gap-1" style={{ color: "oklch(0.60 0.12 148)" }}>
                                  <CheckCircle size={14} /> Saved on {new Date(submission.submittedAt).toLocaleDateString()}
                                </p>
                              ) : <div />}
                              
                              <Button 
                                onClick={() => submitAssignment.mutate({ assignmentId: assignment.id, answer: answers[assignment.id] || "" })}
                                disabled={!answers[assignment.id] || submitAssignment.isPending}
                                className="rounded-full px-6 font-bold shadow-md hover:shadow-lg transition-all"
                                style={{ background: "oklch(0.38 0.08 148)", color: "white" }}
                              >
                                {submitAssignment.isPending ? "Saving..." : (submission ? "Update Answer" : "Save Answer")}
                              </Button>
                            </div>

                            {submission?.feedback && (
                              <div className="mt-6 p-5 rounded-xl border-l-4" style={{ background: "oklch(0.98 0.04 75)", borderColor: "oklch(0.60 0.12 75)" }}>
                                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "oklch(0.60 0.12 75)" }}>Coach Feedback</p>
                                <p className="text-sm leading-relaxed" style={{ color: "oklch(0.38 0.08 148)" }}>{submission.feedback}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
