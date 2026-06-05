import { useState, useEffect } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, PlayCircle, FileText, CheckCircle, ArrowLeft, Send, Upload, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { BRAND } from "../../../shared/brand";
import { Link } from "wouter";
import { useRef } from "react";

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

  const markModuleComplete = trpc.reclaimHub.markModuleComplete.useMutation({
    onSuccess: () => {
      toast.success("Module marked as complete! Next module is now unlocked.");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [fileUrls, setFileUrls] = useState<Record<number, string>>({});
  const [uploadingAssignmentId, setUploadingAssignmentId] = useState<number | null>(null);
  const [expandedAssignmentId, setExpandedAssignmentId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = trpc.clientFiles.upload.useMutation({
    onSuccess: (res, variables) => {
      toast.success(`File uploaded successfully!`);
      // Update fileUrl for the specific assignment
      // (The assignmentId was passed via a temporary property we can't easily access here, so we will handle it in the callback)
    },
    onError: (e) => {
      toast.error(e.message);
      setUploadingAssignmentId(null);
    },
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [loading, isAuthenticated]);

  const modules = data?.modules || [];
  const assignments = data?.assignments || [];
  const submissions = data?.submissions || [];

  const selectedModule = modules.find(m => m.id === selectedModuleId);
  const selectedAssignments = assignments.filter(a => a.moduleId === selectedModuleId);

  // Initialize answers from existing submissions when a module is selected
  useEffect(() => {
    if (selectedModuleId && data) {
      const newAnswers: Record<number, string> = {};
      const newFileUrls: Record<number, string> = {};
      selectedAssignments.forEach(a => {
        const sub = submissions.find(s => s.assignmentId === a.id);
        if (sub) {
          if (sub.answer) newAnswers[a.id] = sub.answer;
          if (sub.fileUrl) newFileUrls[a.id] = sub.fileUrl;
        }
      });
      setAnswers(newAnswers);
      setFileUrls(newFileUrls);
    }
  }, [selectedModuleId, data]);

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "oklch(0.98 0.01 75)" }}>
        <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "oklch(0.38 0.08 148)" }} />
      </div>
    );
  }

  const handleAnswerChange = (assignmentId: number, text: string) => {
    setAnswers(prev => ({ ...prev, [assignmentId]: text }));
  };

  const handleFileUpload = async (assignmentId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be under 10 MB");
      return;
    }

    if (!data?.enrollment?.id) {
      toast.error("Enrollment not found.");
      return;
    }

    setUploadingAssignmentId(assignmentId);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      uploadFile.mutate(
        {
          enrollmentId: data.enrollment.id,
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          base64Data: base64,
        },
        {
          onSuccess: (res) => {
            setFileUrls(prev => ({ ...prev, [assignmentId]: res.url }));
            setUploadingAssignmentId(null);
          }
        }
      );
    };
    reader.onerror = () => {
      toast.error("Failed to read file");
      setUploadingAssignmentId(null);
    };
    reader.readAsDataURL(file);
    e.target.value = ""; // Reset
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
                  const unlocked = mod.isUnlocked;
                  const isCompleted = mod.progress?.completedAt !== undefined && mod.progress?.completedAt !== null && unlocked;

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
                            Week {mod.order}
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
                              Locked until previous week is complete
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
                          <div key={assignment.id} className="bg-white rounded-2xl shadow-sm border overflow-hidden transition-all" style={{ borderColor: "oklch(0.92 0.02 75)" }}>
                            <button 
                              className="w-full text-left p-6 md:p-8 flex items-center justify-between gap-4"
                              onClick={() => setExpandedAssignmentId(expandedAssignmentId === assignment.id ? null : assignment.id)}
                            >
                              <div className="flex gap-4 items-center">
                                <div className="w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: "oklch(0.95 0.04 148)", color: "oklch(0.38 0.08 148)" }}>
                                  {idx + 1}
                                </div>
                                <p className="text-lg font-medium leading-relaxed" style={{ color: "oklch(0.28 0.05 148)" }}>
                                  {assignment.question}
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                {submission && (
                                  <span className="hidden md:inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full" style={{ background: "oklch(0.95 0.04 148)", color: "oklch(0.38 0.08 148)" }}>
                                    <CheckCircle size={12} /> {submission.feedback ? "Reviewed" : "Submitted"}
                                  </span>
                                )}
                                {expandedAssignmentId === assignment.id ? <ChevronUp size={20} style={{ color: "oklch(0.60 0.12 148)" }} /> : <ChevronDown size={20} style={{ color: "oklch(0.60 0.12 148)" }} />}
                              </div>
                            </button>
                            
                            <AnimatePresence>
                              {expandedAssignmentId === assignment.id && (
                                <motion.div 
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="border-t"
                                  style={{ borderColor: "oklch(0.92 0.02 75)" }}
                                >
                                  <div className="p-6 md:p-8 pt-6 flex flex-col gap-4">
                              <Textarea 
                                rows={5}
                                placeholder="Type your reflection here (or upload a document below)..."
                                value={answers[assignment.id] || ""}
                                onChange={e => handleAnswerChange(assignment.id, e.target.value)}
                                className="text-base resize-y p-4 rounded-xl border focus:ring-2"
                                style={{ borderColor: "oklch(0.85 0.02 75)", color: "oklch(0.28 0.05 148)" }}
                              />

                              <div className="flex items-center justify-between p-4 rounded-xl border border-dashed" style={{ borderColor: "oklch(0.85 0.02 75)" }}>
                                <div>
                                  <p className="text-sm font-semibold" style={{ color: "oklch(0.28 0.05 148)" }}>Upload a File (Optional)</p>
                                  <p className="text-xs" style={{ color: "oklch(0.55 0.02 75)" }}>PDF, Word, Images, etc.</p>
                                </div>
                                {fileUrls[assignment.id] ? (
                                  <div className="flex items-center gap-3">
                                    <a 
                                      href={fileUrls[assignment.id]} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
                                      style={{ background: "oklch(0.95 0.04 148)", color: "oklch(0.38 0.08 148)" }}
                                    >
                                      <FileText size={14} /> View Attached File
                                    </a>
                                    <button 
                                      onClick={() => setFileUrls(prev => { const next = {...prev}; delete next[assignment.id]; return next; })}
                                      className="text-xs text-red-500 hover:underline font-medium"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center">
                                    <input 
                                      type="file" 
                                      id={`file-${assignment.id}`} 
                                      className="hidden" 
                                      onChange={(e) => handleFileUpload(assignment.id, e)}
                                    />
                                    <label 
                                      htmlFor={`file-${assignment.id}`}
                                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-opacity hover:opacity-80"
                                      style={{ background: "oklch(0.95 0.04 148)", color: "oklch(0.38 0.08 148)" }}
                                    >
                                      {uploadingAssignmentId === assignment.id ? (
                                        "Uploading..."
                                      ) : (
                                        <><Upload size={14} /> Choose File</>
                                      )}
                                    </label>
                                  </div>
                                )}
                              </div>
                            <div className="mt-4 flex items-center justify-between">
                              {submission ? (
                                <p className="text-xs font-semibold flex items-center gap-1" style={{ color: "oklch(0.60 0.12 148)" }}>
                                  <CheckCircle size={14} /> Saved on {new Date(submission.submittedAt).toLocaleDateString()}
                                </p>
                              ) : <div />}
                              
                              <Button 
                                onClick={() => submitAssignment.mutate({ assignmentId: assignment.id, answer: answers[assignment.id] || "", fileUrl: fileUrls[assignment.id] || "" })}
                                disabled={(!answers[assignment.id] && !fileUrls[assignment.id]) || submitAssignment.isPending || uploadingAssignmentId === assignment.id}
                                className="rounded-full px-6 font-bold shadow-md hover:shadow-lg transition-all"
                                style={{ background: "oklch(0.38 0.08 148)", color: "white" }}
                              >
                                {submitAssignment.isPending ? "Saving..." : (submission ? "Update Submission" : "Save Submission")}
                              </Button>
                            </div>

                            {submission?.feedback && (
                              <div className="mt-6 p-5 rounded-xl border-l-4" style={{ background: "oklch(0.98 0.04 75)", borderColor: "oklch(0.60 0.12 75)" }}>
                                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "oklch(0.60 0.12 75)" }}>Coach Feedback</p>
                                <p className="text-sm leading-relaxed" style={{ color: "oklch(0.38 0.08 148)" }}>{submission.feedback}</p>
                              </div>
                            )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Module Completion Toggle */}
                <div className="mt-16 flex justify-center">
                  <Button
                    onClick={() => {
                      if (!selectedModule.progress?.completedAt) {
                        markModuleComplete.mutate({ moduleId: selectedModule.id });
                      }
                    }}
                    disabled={!!selectedModule.progress?.completedAt || markModuleComplete.isPending}
                    className="rounded-full px-8 py-6 text-lg font-bold shadow-md hover:shadow-lg transition-all"
                    style={{ 
                      background: selectedModule.progress?.completedAt ? "oklch(0.95 0.04 148)" : "oklch(0.38 0.08 148)", 
                      color: selectedModule.progress?.completedAt ? "oklch(0.38 0.08 148)" : "white" 
                    }}
                  >
                    {selectedModule.progress?.completedAt ? (
                      <><CheckCircle className="mr-2 h-5 w-5" /> Completed on {new Date(selectedModule.progress.completedAt).toLocaleDateString()}</>
                    ) : (
                      "Mark Module Complete"
                    )}
                  </Button>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
