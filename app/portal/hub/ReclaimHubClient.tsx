"use client";

import { useState, useEffect } from "react";

import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { getLoginUrl } from "@/lib/const";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, PlayCircle, FileText, CheckCircle, ArrowLeft, Send, Upload, ExternalLink, ChevronDown, ChevronUp, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { BRAND } from "@shared/brand";
import Link from 'next/link';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useRef } from "react";


function getEmbedUrl(url: string) {
  if (!url) return url;
  if (url.includes('youtube.com/watch?v=')) {
    const videoId = new URL(url).searchParams.get('v');
    if (videoId) return `https://www.youtube.com/embed/${videoId}`;
  }
  if (url.includes('youtu.be/')) {
    const videoId = url.split('youtu.be/')[1]?.split('?')[0];
    if (videoId) return `https://www.youtube.com/embed/${videoId}`;
  }
  return url;
}

export default function ReclaimHub() {
  

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
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#faf5f5" }}>
        <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#c9a96e" }} />
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
    <div className="min-h-screen font-sans" style={{ background: "#faf5f5" }}>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b" style={{ borderColor: "#f0e8e4" }}>
        <div className="container max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/portal" className="flex items-center gap-3 group">
            <img src={BRAND.logoUrl} alt={BRAND.name} className="w-10 h-10 rounded-full object-cover shadow-sm group-hover:scale-105 transition-transform" />
            <div>
              <span className="block font-bold text-lg leading-tight" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#2d3b2d" }}>
                Reclaim Hub
              </span>
              <span className="block text-xs" style={{ color: "#8a9a8a" }}>Client Portal</span>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/habit-tracker" className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold shadow-sm" style={{ background: "#fbeee9", color: "#c9a96e" }}>
              <CheckCircle size={16} /> My Daily Reset
            </Link>
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm" style={{ background: "#c9a96e", color: "white" }}>
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
                <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#2d3b2d" }}>
                  Your Reclaim Journey
                </h1>
                <p className="text-lg max-w-2xl mx-auto" style={{ color: "#5a6b5a" }}>
                  Explore your modules, complete assignments, and track your progress through the 6-session Mind & Body Reset program.
                </p>
              </div>

              {/* Free Habit Tracker Banner */}
              <Link href="/habit-tracker" className="block mb-12">
                <div className="p-8 rounded-3xl shadow-md transition-transform hover:scale-[1.02] flex flex-col md:flex-row items-center justify-between gap-6" style={{ background: "linear-gradient(135deg, #fbeee9 0%, #faf5f5 100%)", border: "1px solid #f0e8e4" }}>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle size={20} style={{ color: "#c9a96e" }} />
                      <h2 className="text-2xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#2d3b2d" }}>
                        My Daily Reset Tracker
                      </h2>
                    </div>
                    <p className="text-sm" style={{ color: "#5a6b5a" }}>
                      Track your daily habits—like hydrating, moving your body, and mindful minutes—to build lasting momentum.
                    </p>
                  </div>
                  <div className="flex-shrink-0 px-6 py-3 rounded-full font-bold text-sm shadow-sm" style={{ background: "#c9a96e", color: "white" }}>
                    Open Tracker
                  </div>
                </div>
              </Link>

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
                        borderColor: unlocked ? "oklch(0.85 0.04 148)" : "#f0e8e4",
                      }}
                      onClick={() => unlocked && setSelectedModuleId(mod.id)}
                    >
                      <div className="h-3" style={{ background: unlocked ? "#c9a96e" : "oklch(0.80 0.02 75)" }} />
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full" style={{ background: unlocked ? "#fbeee9" : "#e8c99a", color: unlocked ? "#c9a96e" : "#8a9a8a" }}>
                            Week {mod.order}
                          </span>
                          {!unlocked && <Lock size={18} style={{ color: "oklch(0.65 0.02 75)" }} />}
                          {isCompleted && <CheckCircle size={18} style={{ color: "#8a9a8a" }} />}
                        </div>
                        <h3 className="text-xl font-bold mb-2 leading-tight" style={{ fontFamily: "'Cormorant Garamond', serif", color: unlocked ? "#2d3b2d" : "#8a9a8a" }}>
                          {mod.title}
                        </h3>
                        <p className="text-sm line-clamp-3 mb-6" style={{ color: "#5a6b5a" }}>
                          {mod.description || "Unlock this module after your coaching session to view the content."}
                        </p>
                        <div className="flex items-center justify-between mt-auto">
                          {unlocked ? (
                            <span className="text-sm font-semibold flex items-center gap-2" style={{ color: "#c9a96e" }}>
                              <PlayCircle size={16} /> Enter Workshop
                            </span>
                          ) : (
                            <span className="text-sm italic" style={{ color: "#8a9a8a" }}>
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
                style={{ color: "#5a6b5a" }}
              >
                <ArrowLeft size={16} /> Back to Modules
              </button>

              <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl shadow-black/5 border" style={{ borderColor: "#f0e8e4" }}>
                <div className="mb-8">
                  <span className="text-sm font-bold uppercase tracking-widest px-3 py-1 rounded-full inline-block mb-4" style={{ background: "#fbeee9", color: "#c9a96e" }}>
                    Module {selectedModule.order}
                  </span>
                  <h1 className="text-3xl md:text-5xl font-bold mb-4" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#2d3b2d" }}>
                    {selectedModule.title}
                  </h1>
                  {selectedModule.description && (
                    <p className="text-lg mb-6" style={{ color: "#5a6b5a" }}>{selectedModule.description}</p>
                  )}
                  {selectedModule.session && selectedModule.session.status === "scheduled" && (
                    <div className="flex items-center gap-4 p-4 rounded-xl shadow-sm mb-6 max-w-2xl" style={{ background: "#fdf8f5", border: "1px solid #f0e8e4" }}>
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shrink-0" style={{ background: "#c9a96e" }}>
                        <Calendar size={20} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold" style={{ color: "#2d3b2d" }}>Upcoming Coaching Session</p>
                        <p className="text-xs font-semibold mt-1" style={{ color: "#8a9a8a" }}>
                          {new Date(selectedModule.session.scheduledAt!).toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" })}
                        </p>
                      </div>
                      {selectedModule.session.googleMeetLink && (
                        <a 
                          href={selectedModule.session.googleMeetLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="px-4 py-2 rounded-lg font-bold text-sm text-white shrink-0 shadow-sm transition-transform hover:scale-105"
                          style={{ background: "#2d3b2d" }}
                        >
                          Join Google Meet
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {selectedModule.videoUrl && (
                  <div className="aspect-video w-full rounded-2xl overflow-hidden mb-12 shadow-lg bg-black/5">
                    <iframe 
                      src={getEmbedUrl(selectedModule.videoUrl)} 
                      className="w-full h-full border-0" 
                      allow="autoplay; fullscreen; picture-in-picture" 
                      allowFullScreen 
                    />
                  </div>
                )}

                {selectedModule.content && (
                  (() => {
                    const slides = selectedModule.content.split(/<hr\s*\/?>/i);
                    if (slides.length <= 1) {
                      return <div className="prose prose-lg prose-stone max-w-none mb-12" dangerouslySetInnerHTML={{ __html: selectedModule.content }} />;
                    }
                    return (
                      <div className="mb-12 relative px-8 sm:px-12">
                        <Carousel className="w-full">
                          <CarouselContent>
                            {slides.map((slideHtml: string, index: number) => (
                              <CarouselItem key={index}>
                                <div className="p-2 md:p-6">
                                  <div className="prose prose-lg prose-stone max-w-none" dangerouslySetInnerHTML={{ __html: slideHtml }} />
                                </div>
                              </CarouselItem>
                            ))}
                          </CarouselContent>
                          <CarouselPrevious className="hidden sm:flex" />
                          <CarouselNext className="hidden sm:flex" />
                        </Carousel>
                        <div className="text-center mt-6 text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2" style={{ color: "#c9a96e" }}>
                          <ArrowLeft size={14} /> Swipe to navigate <ArrowLeft size={14} className="rotate-180" />
                        </div>
                      </div>
                    );
                  })()
                )}

                {selectedModule.pdfUrl && (
                  <div className="mb-12 p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4" style={{ background: "#fbeee9", border: "1px solid #e8c99a" }}>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white shadow-sm text-red-500">
                        <FileText size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg" style={{ color: "#2d3b2d" }}>Module Guide & Worksheets</h4>
                        <p className="text-sm" style={{ color: "#5a6b5a" }}>Download the companion PDF for this module.</p>
                      </div>
                    </div>
                    <a 
                      href={selectedModule.pdfUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-6 py-3 rounded-full font-bold text-sm transition-transform hover:scale-105 shadow-md"
                      style={{ background: "#c9a96e", color: "white" }}
                    >
                      Download PDF
                    </a>
                  </div>
                )}

                {selectedAssignments.length > 0 && (
                  <div className="mt-16 pt-12 border-t" style={{ borderColor: "#f0e8e4" }}>
                    <h2 className="text-2xl md:text-3xl font-bold mb-8" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#2d3b2d" }}>
                      Reflection & Assignments
                    </h2>
                    
                    <div className="space-y-10">
                      {selectedAssignments.map((assignment, idx) => {
                        const submission = submissions.find(s => s.assignmentId === assignment.id);
                        
                        return (
                          <div key={assignment.id} className="bg-white rounded-2xl shadow-sm border overflow-hidden transition-all" style={{ borderColor: "#f0e8e4" }}>
                            <button 
                              className="w-full text-left p-6 md:p-8 flex items-center justify-between gap-4"
                              onClick={() => setExpandedAssignmentId(expandedAssignmentId === assignment.id ? null : assignment.id)}
                            >
                              <div className="flex gap-4 items-center">
                                <div className="w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: "#fbeee9", color: "#c9a96e" }}>
                                  {idx + 1}
                                </div>
                                <p className="text-lg font-medium leading-relaxed" style={{ color: "#2d3b2d" }}>
                                  {assignment.question}
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                {submission && (
                                  <span className="hidden md:inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full" style={{ background: "#fbeee9", color: "#c9a96e" }}>
                                    <CheckCircle size={12} /> {submission.feedback ? "Reviewed" : "Submitted"}
                                  </span>
                                )}
                                {expandedAssignmentId === assignment.id ? <ChevronUp size={20} style={{ color: "#8a9a8a" }} /> : <ChevronDown size={20} style={{ color: "#8a9a8a" }} />}
                              </div>
                            </button>
                            
                            <AnimatePresence>
                              {expandedAssignmentId === assignment.id && (
                                <motion.div 
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="border-t"
                                  style={{ borderColor: "#f0e8e4" }}
                                >
                                  <div className="p-6 md:p-8 pt-6 flex flex-col gap-4">
                              <Textarea 
                                rows={5}
                                placeholder="Type your reflection here (or upload a document below)..."
                                value={answers[assignment.id] || ""}
                                onChange={e => handleAnswerChange(assignment.id, e.target.value)}
                                className="text-base resize-y p-4 rounded-xl border focus:ring-2"
                                style={{ borderColor: "#f0e8e4", color: "#2d3b2d" }}
                              />

                              <div className="flex items-center justify-between p-4 rounded-xl border border-dashed" style={{ borderColor: "#f0e8e4" }}>
                                <div>
                                  <p className="text-sm font-semibold" style={{ color: "#2d3b2d" }}>Upload a File (Optional)</p>
                                  <p className="text-xs" style={{ color: "#8a9a8a" }}>PDF, Word, Images, etc.</p>
                                </div>
                                {fileUrls[assignment.id] ? (
                                  <div className="flex items-center gap-3">
                                    <a 
                                      href={fileUrls[assignment.id]} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
                                      style={{ background: "#fbeee9", color: "#c9a96e" }}
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
                                      style={{ background: "#fbeee9", color: "#c9a96e" }}
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
                                <p className="text-xs font-semibold flex items-center gap-1" style={{ color: "#8a9a8a" }}>
                                  <CheckCircle size={14} /> Saved on {new Date(submission.submittedAt).toLocaleDateString()}
                                </p>
                              ) : <div />}
                              
                              <Button 
                                onClick={() => submitAssignment.mutate({ assignmentId: assignment.id, answer: answers[assignment.id] || "", fileUrl: fileUrls[assignment.id] || "" })}
                                disabled={(!answers[assignment.id] && !fileUrls[assignment.id]) || submitAssignment.isPending || uploadingAssignmentId === assignment.id}
                                className="rounded-full px-6 font-bold shadow-md hover:shadow-lg transition-all"
                                style={{ background: "#c9a96e", color: "white" }}
                              >
                                {submitAssignment.isPending ? "Saving..." : (submission ? "Update Submission" : "Save Submission")}
                              </Button>
                            </div>

                            {submission?.feedback && (
                              <div className="mt-6 p-5 rounded-xl border-l-4" style={{ background: "oklch(0.98 0.04 75)", borderColor: "#c9a96e" }}>
                                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#c9a96e" }}>Coach Feedback</p>
                                <p className="text-sm leading-relaxed" style={{ color: "#c9a96e" }}>{submission.feedback}</p>
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
                      background: selectedModule.progress?.completedAt ? "#fbeee9" : "#c9a96e", 
                      color: selectedModule.progress?.completedAt ? "#c9a96e" : "white" 
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
