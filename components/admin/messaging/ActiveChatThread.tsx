// @ts-nocheck
"use client";

import React, { useState, useEffect, useRef, Fragment } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { useInbox } from "./InboxContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Phone, ArrowLeft, Plane, Loader2, MessageSquare, CreditCard, Star, Paperclip, Workflow, Link2, Video, Send, Clock, FileText, ChevronRight, RotateCcw } from "lucide-react";
import { useInboxPollInterval } from "@/lib/useInboxPollInterval";
import { toast } from "sonner";
import { isToday, isYesterday, format } from "date-fns";

function renderMarkdown(text: string) {
  return text.split('\n').map((line, i) => {
    const parts = line.split('**');
    return (
      <span key={i}>
        {parts.map((part, j) => j % 2 === 1 ? <strong key={j}>{part}</strong> : part)}
        <br />
      </span>
    );
  });
}

function formatDateSeparator(dateString: string | Date | null | undefined) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "EEEE, MMMM do, yyyy");
}

export default function ActiveChatThread({ chatId }: { chatId: number }) {
  const router = useRouter();
  const utils = trpc.useContext();
  const { setDialerPrefill, setDialerOpen, setPaymentModalOpen, setTemplatesModalOpen, setFullscreenImage, setIsProfileOpen, setActiveChatMeta } = useInbox();

  const [messageText, setMessageText] = useState("");
  const [isInternalMode, setIsInternalMode] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingUploadUrl, setPendingUploadUrl] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const pollInterval = useInboxPollInterval(3000, 15000);
  const { data: activeChat, isLoading: isLoadingChat } = trpc.messaging.getConversation.useQuery({ id: chatId }, {
    refetchInterval: pollInterval
  });
  
  const { data: sequencesData = [] } = trpc.crmAutomations.listSequences.useQuery();
  const { data: templates = [] } = trpc.messaging.listTemplates.useQuery();

  const activeName = activeChat?.conversation?.userName || activeChat?.conversation?.contactPhone || "Unknown Customer";
  const activePhone = activeChat?.conversation?.contactPhone || "Unknown";

  const injectTextTemplate = (templateText: string) => {
    const firstName = activeName.split(' ')[0] || "there";
    const lastName = activeName.split(' ').slice(1).join(' ') || "";
    
    const processed = templateText
      .replace(/\{firstName\}/gi, firstName)
      .replace(/\{name\}/gi, activeName)
      .replace(/\(\(first_name\)\)/gi, firstName)
      .replace(/\(\(last_name\)\)/gi, lastName)
      .replace(/\(\(name\)\)/gi, activeName);
      
    setMessageText((prev) => prev ? `${prev}\n\n${processed}` : processed);
  };
  
  useEffect(() => {
    if (activeChat?.conversation) {
      setActiveChatMeta({
        conversationId: chatId,
        userId: activeChat.conversation.userId ?? null,
        contactPhone: activeChat.conversation.contactPhone ?? null,
        userName: activeChat.conversation.userName ?? null,
      });
    }
    return () => setActiveChatMeta(null);
  }, [activeChat?.conversation, chatId, setActiveChatMeta]);

  useEffect(() => {
    const handleInsertTemplate = (e: any) => {
      injectTextTemplate(e.detail);
    };
    const handleInjectPaymentLink = (e: any) => {
      const url = e.detail as string;
      if (url) {
        setMessageText(prev => prev + (prev ? " " : "") + url);
      }
    };
    window.addEventListener('insert-template', handleInsertTemplate);
    window.addEventListener('inject-payment-link', handleInjectPaymentLink);
    return () => {
      window.removeEventListener('insert-template', handleInsertTemplate);
      window.removeEventListener('inject-payment-link', handleInjectPaymentLink);
    };
  }, [activeName]);

  const markAsRead = trpc.messaging.markAsRead.useMutation({
    onSuccess: () => {
      utils.messaging.listConversations.invalidate();
      utils.messaging.getConversation.invalidate();
    }
  });

  useEffect(() => {
    if (activeChat?.conversation?.unreadCount && activeChat.conversation.unreadCount > 0) {
      markAsRead.mutate({ conversationId: chatId });
    }
  }, [activeChat?.conversation?.unreadCount, chatId]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [activeChat?.messages?.length]);

  const sendSms = trpc.messaging.mockSendSms.useMutation({
    onSuccess: () => {
      setMessageText("");
      setPendingUploadUrl(null);
      setScheduledDate(null);
      setIsInternalMode(false);
      utils.messaging.getConversation.invalidate({ id: chatId });
      utils.messaging.listConversations.invalidate();
      
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
      }, 100);
    },
    onError: (err) => {
      toast.error(`Failed to send message: ${err.message}`);
    }
  });

  const retryFailed = trpc.messaging.retryFailedMessage.useMutation({
    onSuccess: () => {
      toast.success("Message resent");
      utils.messaging.getConversation.invalidate({ id: chatId });
    },
    onError: (err) => toast.error(err.message),
  });

  const closeChat = trpc.messaging.closeConversation.useMutation({
    onSuccess: () => {
      toast.success("Chat closed");
      router.push("/admin/v2-inbox");
    }
  });

  const enrollInSequence = trpc.crmAutomations.enrollInSequence.useMutation({
    onSuccess: () => {
      toast.success("User enrolled in sequence successfully!");
    },
    onError: (err) => {
      toast.error(`Failed to enroll in sequence: ${err.message}`);
    }
  });

  const sendReviewInvite = { isPending: false, mutate: (...args: any[]) => alert("Not implemented") };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      
      setPendingUploadUrl(data.url);
      toast.success("File attached! Type a message or just click send.");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDial = (number: string) => {
    let clean = number.replace(/\D/g, "");
    if (clean.length === 10) clean = "1" + clean;
    if (!clean.startsWith("+")) clean = "+" + clean;
    setDialerPrefill(clean);
    setDialerOpen(true);
  };

  const injectTemplate = (text: string) => {
    setMessageText(prev => prev + (prev ? " " : "") + text);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50/50 overflow-hidden">
      <div className="h-[65px] shrink-0 z-10 relative border-b flex items-center px-2 sm:px-6 bg-white shadow-sm">
        <div className="flex-1 flex justify-start">
          <Button variant="ghost" size="icon" className="md:hidden h-10 w-10 rounded-full border border-slate-200 bg-white hover:bg-slate-50 shrink-0 shadow-sm" onClick={() => router.push("/admin/v2-inbox")}>
            <ArrowLeft className="h-4 w-4 text-slate-700" />
          </Button>
          <div className="hidden sm:block">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-slate-200 text-slate-600">{activeName !== "Unknown Customer" && activeName !== "Unknown" ? activeName.charAt(0).toUpperCase() : "U"}</AvatarFallback>
            </Avatar>
          </div>
        </div>
        
        <div className="flex-[2] flex flex-col items-center justify-center text-center">
          <button 
            className="flex flex-col items-center hover:bg-slate-50 px-4 py-1.5 rounded-full transition-colors group"
            onClick={() => setIsProfileOpen(true)}
          >
            <p className="font-bold text-[15px] text-slate-900 leading-tight truncate px-1 flex items-center justify-center gap-1.5">
              {activeName}
              {activeChat?.conversation?.isPremium && <Plane className="h-4 w-4 text-amber-500 fill-amber-500 shrink-0" />}
              <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-colors -ml-1" />
            </p>
            <p className="text-[11px] text-slate-500 font-medium truncate px-1 mt-0.5 tracking-wide">{activePhone !== "Unknown" ? (activeChat?.conversation?.platform === 'facebook' || activeChat?.conversation?.platform === 'instagram' ? (activeChat?.conversation?.platform === 'instagram' ? 'Instagram Chat' : 'Facebook Messenger') : activePhone) : "No phone number"}</p>
          </button>
        </div>
        
        <div className="flex-1 flex items-center justify-end gap-1 sm:gap-2 shrink-0">
          <Button variant="ghost" size="sm" onClick={() => closeChat.mutate({ id: chatId })} className="text-slate-500 hover:text-red-600 hidden sm:flex">
            Close Chat
          </Button>
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-[#1da05c] hover:bg-[#188c50] text-white shadow-sm shrink-0 flex items-center justify-center" onClick={() => {
            const phone = activePhone !== "Unknown" ? activePhone : "";
            if (phone) {
              handleDial(phone);
            } else {
              setDialerPrefill("");
              setDialerOpen(true);
            }
          }} title="Call this contact">
            <Phone className="h-4 w-4 fill-white text-white" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0" ref={scrollContainerRef}>
        <div className="space-y-6 max-w-3xl w-full mx-auto p-6 pt-10 pb-8">
          {isLoadingChat && (
            <div className="flex justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          
          {activeChat?.messages?.map((msg, index, array) => {
            const currentDate = new Date(msg.createdAt).toLocaleDateString();
            const prevDate = index > 0 ? new Date(array[index - 1].createdAt).toLocaleDateString() : null;
            const showDateSeparator = currentDate !== prevDate;
            
            return (
              <Fragment key={msg.id}>
                {showDateSeparator && (
                  <div className="flex justify-center my-6">
                    <Badge variant="secondary" className="text-[10px] font-medium text-muted-foreground bg-muted/50 uppercase tracking-widest px-3 py-1">
                      {formatDateSeparator(msg.createdAt)}
                    </Badge>
                  </div>
                )}
                {msg.direction === "system" ? (
                  <div className="flex justify-center w-full my-3">
                    <div className="bg-slate-100 border border-slate-200 text-slate-500 text-xs font-medium px-4 py-1.5 rounded-full shadow-sm max-w-[85%] text-center flex items-center gap-2">
                      <span className="shrink-0 text-sm">{msg.content?.includes("Google") ? "⭐" : msg.content?.includes("Facebook") ? "👍" : "ℹ️"}</span>
                      {msg.content}
                    </div>
                  </div>
                ) : msg.type === "call" ? (
                  <div className={`flex flex-col w-full my-1 ${msg.direction === "outbound" ? "items-end" : "items-start"}`}>
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border bg-white shadow-sm max-w-[80%] ${msg.status === 'failed' || msg.status === 'no-answer' || msg.status === 'busy' || msg.status === 'canceled' ? 'border-red-100' : 'border-slate-200'}`}>
                      {msg.status === 'failed' || msg.status === 'no-answer' || msg.status === 'busy' || msg.status === 'canceled' ? (
                        <>
                          <Phone className="w-3.5 h-3.5 text-red-500 shrink-0" />
                          <span className="text-[13px] font-medium text-red-600">{msg.direction === "outbound" ? "Call failed" : "Missed call"}</span>
                        </>
                      ) : (
                        <>
                          <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="text-[13px] font-medium text-slate-700">{msg.direction === "inbound" ? "Incoming call" : "Outgoing call"} {msg.durationSeconds ? `(${Math.floor(msg.durationSeconds / 60)}m ${msg.durationSeconds % 60}s)` : ""}</span>
                        </>
                      )}
                    </div>
                      <span suppressHydrationWarning className={`text-[10px] mt-1 px-1 ${msg.direction === "outbound" ? "text-slate-400" : "text-slate-400"}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {msg.direction === "outbound" && (msg as any).isAutomated && " • AI"}
                      </span>
                    {msg.content && (
                      <Accordion type="single" collapsible className="w-[80%] mt-2">
                        <AccordionItem value={`call-${msg.id}`} className="border-b-0">
                          <AccordionTrigger className="hover:no-underline py-2 px-3 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 rounded-lg shadow-sm">
                            View AI Call Transcript/Summary
                          </AccordionTrigger>
                          <AccordionContent className="pt-2">
                            <div className="bg-slate-50 p-3 rounded-lg text-xs text-slate-600 whitespace-pre-wrap border border-slate-200">
                              {renderMarkdown(msg.content)}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    )}
                  </div>
                ) : (
                  <div className={`flex flex-col gap-1 ${msg.direction === "outbound" ? "items-end" : "items-start"}`}>
                    <div className={`${msg.direction === "outbound" ? "bg-[#E8EDFB] text-slate-900 rounded-tr-sm shadow-sm" : "bg-[#f1f1f1] text-slate-900 rounded-tl-sm"} p-3 rounded-2xl max-w-[80%] text-sm`}>
                      {msg.mediaUrl && (
                        <img 
                          src={msg.mediaUrl!.includes("twilio.com") ? `/api/crm/media?url=${encodeURIComponent(msg.mediaUrl!)}` : msg.mediaUrl} 
                          alt="Attachment" 
                          className="max-w-full rounded-md mb-2 object-contain max-h-64 cursor-zoom-in hover:opacity-90 transition-opacity" 
                          onClick={(e) => {
                            if (e.currentTarget.style.display === 'none') return;
                            const url = msg.mediaUrl!.includes("twilio.com") ? `/api/crm/media?url=${encodeURIComponent(msg.mediaUrl!)}` : msg.mediaUrl;
                            if(url) setFullscreenImage(url);
                          }} 
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const a = document.createElement('a');
                            a.href = msg.mediaUrl!.includes("twilio.com") ? `/api/crm/media?url=${encodeURIComponent(msg.mediaUrl!)}` : msg.mediaUrl!;
                            a.target = "_blank";
                            a.className = "text-blue-500 underline text-xs block mb-2";
                            a.textContent = "📎 View Document Attachment";
                            e.currentTarget.parentNode?.insertBefore(a, e.currentTarget);
                          }}
                        />
                      )}
                      {msg.content && <p className="whitespace-pre-wrap break-words">{msg.content}</p>}
                    </div>
                    <span suppressHydrationWarning className="text-[10px] text-muted-foreground">
                      {msg.senderName || (msg.direction === "outbound" ? "Admin" : "Customer")} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {msg.direction === "outbound" && (
                        <>
                          {" • "}
                          {msg.status === "failed" ? (
                            <span className="inline-flex items-center gap-1 text-red-500 font-medium capitalize">
                              {msg.status}
                              <button
                                type="button"
                                className="inline-flex items-center gap-0.5 text-[10px] underline hover:no-underline"
                                disabled={retryFailed.isPending}
                                onClick={() => retryFailed.mutate({ messageId: msg.id })}
                              >
                                <RotateCcw className="w-2.5 h-2.5" />
                                retry
                              </button>
                            </span>
                          ) : msg.status === "delivered" ? (
                            <span className="text-green-600 font-medium capitalize">{msg.status}</span>
                          ) : (
                            <span className="text-slate-400 capitalize">{msg.status || "sent"}</span>
                          )}
                        </>
                      )}
                    </span>
                  </div>
                )}
              </Fragment>
            );
          })}
        </div>
      </div>

      <div className="p-4 bg-background border-t">
        <div className="border rounded-xl bg-white shadow-sm focus-within:ring-1 focus-within:ring-slate-300 transition-all overflow-hidden">
          <div className="flex items-center gap-1 mb-2 px-2 pt-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600" title="Templates" onClick={() => setTemplatesModalOpen(true)}>
              <MessageSquare className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600" title="Payment Request" onClick={() => setPaymentModalOpen(true)}>
              <CreditCard className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-slate-600"
              title="Review Request (sends now + 1 follow-up in 3 days)"
              disabled={sendReviewInvite.isPending || !activePhone || activePhone === "Unknown"}
              onClick={() => {
                sendReviewInvite.mutate({
                  phone: activePhone,
                  name: activeName !== "Unknown Customer" ? activeName : undefined,
                  userId: activeChat?.conversation?.userId ?? undefined,
                });
              }}
            >
              {sendReviewInvite.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Star className="h-4 w-4" />
              )}
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600" title="Attach File" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
            </Button>
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept="image/*,application/pdf" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600" title="Enroll in Sequence">
                  <Workflow className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {sequencesData.length === 0 ? (
                  <DropdownMenuItem disabled>No sequences found</DropdownMenuItem>
                ) : (
                  sequencesData.map((seq) => (
                    <DropdownMenuItem 
                      key={seq.id}
                      onClick={() => {
                        if (activeChat?.conversation?.userId) {
                          enrollInSequence.mutate({ 
                            userId: activeChat.conversation.userId, 
                            sequenceId: seq.id 
                          });
                        } else {
                          toast.error("Contact must be linked to a User account to enroll in sequences.");
                        }
                      }}
                    >
                      {seq.name}
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600" title="Insert Template">
                  <FileText className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64 max-h-64 overflow-y-auto">
                <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 uppercase">Message Templates</div>
                {templates.length === 0 ? (
                  <div className="px-2 py-2 text-xs text-slate-400">No templates found</div>
                ) : (
                  templates.map(t => (
                    <DropdownMenuItem 
                      key={t.id} 
                      className="cursor-pointer"
                      onClick={() => injectTextTemplate(t.text)}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900">{t.name}</span>
                        <span className="text-xs text-slate-500 truncate mt-0.5">{t.text}</span>
                      </div>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600" title="Insert Link" onClick={() => injectTemplate("https://")}>
              <Link2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600" title="Video Meeting" onClick={() => injectTemplate("Join my video room here: ((video_room))")}>
              <Video className="h-4 w-4" />
            </Button>
          </div>
          
          <textarea 
            className="w-full min-h-[80px] p-3 text-sm focus:outline-none resize-none"
            placeholder={`Message ${activeName}...`}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
          />
          
          {pendingUploadUrl && (
            <div className="px-3 pb-2 flex items-center gap-2">
              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 flex items-center gap-1">
                <Paperclip className="h-3 w-3" />
                Attachment ready
                <button onClick={() => setPendingUploadUrl(null)} className="ml-1 hover:text-red-500">×</button>
              </Badge>
            </div>
          )}
          
          <div className="flex items-center justify-between p-2 bg-white rounded-b-xl border-t">
            <div className="flex gap-1 items-center">
              <div className="relative">
                <input 
                  type="datetime-local" 
                  className="absolute opacity-0 w-0 h-0" 
                  id="schedule-date-picker"
                  value={scheduledDate || ""}
                  onChange={(e) => setScheduledDate(e.target.value)}
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={`h-8 w-8 transition-colors ${scheduledDate ? "bg-blue-100 text-blue-700 hover:bg-blue-200" : "text-slate-400 hover:text-blue-600"}`}
                  title="Schedule Message"
                  onClick={() => (document.getElementById('schedule-date-picker') as HTMLInputElement)?.showPicker()}
                >
                  <Clock className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {scheduledDate && (
                <Badge variant="outline" className="text-[10px] text-blue-600 border-blue-200 bg-blue-50 cursor-pointer" onClick={() => setScheduledDate(null)}>
                  Scheduled: {new Date(scheduledDate).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  <span className="ml-1 hover:text-blue-800">×</span>
                </Badge>
              )}
              <span className="text-xs text-muted-foreground mr-2 hidden sm:inline-block">
                {messageText.length} / 1,600 characters
              </span>
              <Button 
                size="sm" 
                className={`bg-slate-900 hover:bg-slate-800 text-white rounded-full px-4`}
                disabled={(!messageText.trim() && !pendingUploadUrl) || sendSms.isPending}
                onClick={() => {
                  if (messageText.trim() || pendingUploadUrl) {
                    sendSms.mutate({ 
                      conversationId: chatId, 
                      content: messageText.trim() || undefined, 
                      mediaUrl: pendingUploadUrl || undefined,
                      scheduledAt: scheduledDate || undefined
                    });
                  }
                }}
              >
                {sendSms.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                {scheduledDate ? "Schedule" : "Send"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
