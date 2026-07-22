"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { useInbox } from "./InboxContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Loader2,
  Star,
  Paperclip,
  Link2,
  Video,
  Send,
  Clock,
  FileText,
  MessageSquare,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";
import ContactRecipientPicker from "./ContactRecipientPicker";
import {
  resolveComposeRecipientPhone,
  type ComposeContactHit,
} from "@/lib/composeRecipient";

export default function NewChatComposeModal() {
  const router = useRouter();
  const utils = trpc.useContext();
  const { isNewChatOpen, setIsNewChatOpen, setActiveChatMeta, setPaymentModalOpen, setTemplatesModalOpen, newChatPrefill, setNewChatPrefill } =
    useInbox();

  const [recipientQuery, setRecipientQuery] = useState("");
  const [selectedContact, setSelectedContact] = useState<ComposeContactHit | null>(null);
  const [messageText, setMessageText] = useState("");
  const [scheduledDate, setScheduledDate] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingUploadUrl, setPendingUploadUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: templates = [] } = trpc.messaging.listTemplates.useQuery();

  const resetForm = () => {
    setRecipientQuery("");
    setSelectedContact(null);
    setMessageText("");
    setScheduledDate(null);
    setPendingUploadUrl(null);
    setNewChatPrefill(null);
  };

  useEffect(() => {
    if (isNewChatOpen && newChatPrefill) {
      setRecipientQuery(newChatPrefill.name || newChatPrefill.phone || "");
      setSelectedContact({
        id: String(newChatPrefill.userId || ""),
        name: newChatPrefill.name || "Unknown",
        email: null,
        phone: newChatPrefill.phone || null,
        source: "contact",
        userId: newChatPrefill.userId || null
      });
    }
  }, [isNewChatOpen, newChatPrefill]);

  const resolvedPhone = resolveComposeRecipientPhone(recipientQuery, selectedContact);

  const handleOpenChange = (open: boolean) => {
    setIsNewChatOpen(open);
    if (!open) resetForm();
  };

  const injectTextTemplate = (templateText: string) => {
    const processed = templateText
      .replace(/\{firstName\}/gi, "there")
      .replace(/\{name\}/gi, "Customer")
      .replace(/\(\(first_name\)\)/gi, "there")
      .replace(/\(\(last_name\)\)/gi, "")
      .replace(/\(\(name\)\)/gi, "Customer");
    setMessageText(prev => (prev ? `${prev}\n\n${processed}` : processed));
  };

  useEffect(() => {
    const handleInsertTemplate = (e: Event) => {
      injectTextTemplate((e as CustomEvent<string>).detail);
    };
    window.addEventListener("insert-template", handleInsertTemplate);
    return () => window.removeEventListener("insert-template", handleInsertTemplate);
  }, []);

  const sendSms = trpc.messaging.sendNewMessage.useMutation({
    onSuccess: data => {
      const contact = selectedContact;
      const phone = contact?.phone ?? recipientQuery;
      const name = contact?.name ?? recipientQuery;
      resetForm();
      setIsNewChatOpen(false);
      utils.messaging.listConversations.invalidate();
      toast.success("Message sent successfully!");
      if (data.conversationId) {
        setActiveChatMeta({
          conversationId: data.conversationId,
          userId: contact?.userId ?? null,
          contactPhone: phone,
          userName: name,
        });
      }
    },
    onError: err => {
      toast.error(`Failed to send message: ${err.message}`);
    },
  });

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
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const injectTemplate = (text: string) => {
    setMessageText(prev => prev + (prev ? " " : "") + text);
  };

  return (
    <Dialog open={isNewChatOpen} onOpenChange={handleOpenChange}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-lg p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 py-4 border-b">
          <DialogTitle className="text-base font-semibold">New message</DialogTitle>
        </DialogHeader>

        <div className="px-5 py-4 space-y-4">
          <ContactRecipientPicker
            value={recipientQuery}
            selected={selectedContact}
            onValueChange={setRecipientQuery}
            onSelect={setSelectedContact}
          />
          {selectedContact && !selectedContact.phone && (
            <p className="text-xs text-amber-700 -mt-2">
              This contact has no phone number on file. Type a number or pick someone else.
            </p>
          )}

          <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
            <div className="flex items-center gap-1 px-2 pt-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-400"
                title="Templates"
                onClick={() => setTemplatesModalOpen(true)}
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-400"
                title="Payment Request"
                onClick={() => setPaymentModalOpen(true)}
              >
                <CreditCard className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-400"
                title="Review Request"
                onClick={() =>
                  injectTemplate(
                    "Thanks for booking with Mind and Body! We'd love if you could leave us a quick review: https://coachmindandbody.com/reviews"
                  )
                }
              >
                <Star className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-400"
                title="Attach File"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Paperclip className="h-4 w-4" />
                )}
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileUpload}
                accept="image/*,application/pdf"
              />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                    <FileText className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64 max-h-64 overflow-y-auto">
                  <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 uppercase">
                    Message Templates
                  </div>
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
            </div>

            <textarea
              className="w-full min-h-[120px] p-3 text-sm focus:outline-none resize-none border-t"
              placeholder="Type your message..."
              value={messageText}
              onChange={e => setMessageText(e.target.value)}
            />

            {pendingUploadUrl && (
              <div className="px-3 pb-2 flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className="text-xs bg-blue-100 text-blue-700 flex items-center gap-1"
                >
                  <Paperclip className="h-3 w-3" />
                  Attachment ready
                  <button
                    type="button"
                    onClick={() => setPendingUploadUrl(null)}
                    className="ml-1 hover:text-red-500"
                  >
                    ×
                  </button>
                </Badge>
              </div>
            )}

            <div className="flex items-center justify-between p-3 border-t bg-slate-50">
              <div className="flex gap-1 items-center">
                <input
                  type="datetime-local"
                  className="absolute opacity-0 w-0 h-0"
                  id="compose-schedule-picker"
                  value={scheduledDate || ""}
                  onChange={e => setScheduledDate(e.target.value)}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 ${scheduledDate ? "text-blue-700 bg-blue-100" : "text-slate-400"}`}
                  title="Schedule Message"
                  onClick={() =>
                    (
                      document.getElementById("compose-schedule-picker") as HTMLInputElement
                    )?.showPicker()
                  }
                >
                  <Clock className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                {scheduledDate && (
                  <Badge
                    variant="outline"
                    className="text-[10px] cursor-pointer"
                    onClick={() => setScheduledDate(null)}
                  >
                    Scheduled
                    <span className="ml-1">×</span>
                  </Badge>
                )}
                <Button
                  size="sm"
                  className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-4"
                  disabled={
                    !resolvedPhone ||
                    (!messageText.trim() && !pendingUploadUrl) ||
                    sendSms.isPending
                  }
                  onClick={() => {
                    if (!resolvedPhone) {
                      toast.error("Enter a name with a phone on file, or type a phone number.");
                      return;
                    }
                    sendSms.mutate({
                      phone: resolvedPhone,
                      content: messageText.trim() || undefined,
                      mediaUrl: pendingUploadUrl || undefined,
                    });
                  }}
                >
                  {sendSms.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Send
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
