"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useInbox } from "../InboxContext";
import { useTwilioVoice } from "@/hooks/useTwilioVoice";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, X, CreditCard } from "lucide-react";
import IncomingCallBanner from "@/components/crm/IncomingCallBanner";
import DialerModal from "@/components/crm/DialerModal";
import VideoCallModal from "@/components/crm/VideoCallModal";
import NewChatComposeModal from "./NewChatComposeModal";

export default function InboxModals() {
  const {
    dialerOpen, setDialerOpen,
    dialerPrefill,
    videoModalOpen, setVideoModalOpen,
    activeVideoRoom,
    paymentModalOpen, setPaymentModalOpen,
    templatesModalOpen, setTemplatesModalOpen,
    fullscreenImage, setFullscreenImage,
    activeChatMeta,
  } = useInbox();

  const router = useRouter();
  const voice = useTwilioVoice();
  const { data: templates } = trpc.templates.list.useQuery();
  const { data: conversations = [] } = trpc.messaging.listConversations.useQuery();

  // We need to trigger the Twilio connection on first click to bypass browser audio policies
  useEffect(() => {
    let initialized = false;
    const handleFirstInteraction = () => {
      if (!initialized && voice.isConfigured) {
        initialized = true;
        voice.connectVoice().catch(e => console.error("Twilio Voice connect error:", e));
      }
    };
    
    document.addEventListener("click", handleFirstInteraction, { once: true });
    return () => document.removeEventListener("click", handleFirstInteraction);
  }, [voice]);

  const [customAmount, setCustomAmount] = React.useState("");
  const [customDescription, setCustomDescription] = React.useState("");

  const injectPaymentLink = (url: string) => {
    window.dispatchEvent(new CustomEvent("inject-payment-link", { detail: url }));
  };

  const activeUserId = activeChatMeta?.userId || 0;

  const generateCustomLink = trpc.stripe.createCustomPaymentLink.useMutation({
    onSuccess: (data) => {
      if (!data.url) {
        toast.error("Stripe did not return a payment URL");
        return;
      }
      injectPaymentLink(data.url);
      setPaymentModalOpen(false);
      setCustomAmount("");
      setCustomDescription("");
      toast.success("Payment link added to message!");
    },
    onError: (err) => toast.error(`Error: ${err.message}`),
  });

  const generateSubLink = trpc.stripe.createSubscriptionLink.useMutation({
    onSuccess: (data) => {
      if (!data.url) {
        toast.error("Stripe did not return a payment URL");
        return;
      }
      injectPaymentLink(data.url);
      setPaymentModalOpen(false);
      toast.success("Subscription link added to message!");
    },
    onError: (err) => toast.error(`Error: ${err.message}`),
  });

  const { data: callerContact } = trpc.messaging.resolveContactByPhone.useQuery(
    { phone: voice.callerNumber || "" },
    { enabled: !!voice.callerNumber && voice.callerNumber !== "Unknown Caller" }
  );

  const isCallActive =
    voice.status === "incoming" ||
    voice.status === "in-call" ||
    voice.status === "ringing" ||
    voice.status === "connecting";

  // Once a call connects, use IncomingCallBanner only — hide the dialer sheet.
  useEffect(() => {
    if (isCallActive && dialerOpen) {
      setDialerOpen(false);
    }
  }, [isCallActive, dialerOpen, setDialerOpen]);

  // Auto-open chat thread when an incoming call matches a known contact
  useEffect(() => {
    if (voice.status === "incoming" && voice.callerNumber) {
      const cleanIncoming = voice.callerNumber.replace(/\D/g, "").replace(/^1/, "");
      const match = conversations.find(c => {
        const cleanContact = (c.contactPhone || "").replace(/\D/g, "").replace(/^1/, "");
        return cleanContact === cleanIncoming;
      });
      if (match) {
        router.push(`/admin/v2-inbox/chat/${match.id}`);
      }
    }
  }, [voice.status, voice.callerNumber, conversations, router]);

  return (
    <>
      <NewChatComposeModal />
      {isCallActive && (
        <IncomingCallBanner
          status={voice.status}
          callerNumber={voice.callerNumber}
          callerName={callerContact?.name || null}
          callDuration={voice.callDuration}
          isMuted={voice.isMuted}
          isRecordingPaused={voice.isRecordingPaused}
          onAccept={voice.acceptCall}
          onReject={voice.rejectCall}
          onHangUp={voice.hangUp}
          onToggleMute={voice.toggleMute}
          onToggleRecordingPause={voice.toggleRecordingPause}
        />
      )}

      {/* Payment Link Modal */}
      {paymentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-semibold text-slate-900">Generate Payment Link</h3>
              <button onClick={() => setPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-slate-700">Custom Payment (One-time)</h4>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                    <input 
                      type="number" 
                      placeholder="Amount" 
                      className="w-full pl-7 pr-3 py-2 border rounded-lg"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                    />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Description (e.g. Trip Deposit)" 
                    className="flex-[2] px-3 py-2 border rounded-lg"
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                  />
                </div>
                <Button 
                  className="w-full" 
                  disabled={!customAmount || !customDescription || generateCustomLink.isPending}
                  onClick={() => generateCustomLink.mutate({ 
                    amountInDollars: Number(customAmount), 
                    description: customDescription, 
                    userId: activeUserId,
                  })}
                >
                  {generateCustomLink.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CreditCard className="w-4 h-4 mr-2" />}
                  Generate Custom Checkout Link
                </Button>
              </div>
              <div className="border-t border-slate-100"></div>
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-slate-700">Flight Deal Subscriptions</h4>
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-left bg-slate-50 hover:bg-slate-100"
                  disabled={generateSubLink.isPending}
                  onClick={() => generateSubLink.mutate({ userId: activeUserId })}
                >
                  <CreditCard className="w-4 h-4 mr-2 text-slate-500" />
                  Standard Subscription ($39/yr)
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-left bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                  disabled={generateSubLink.isPending}
                  onClick={() => generateSubLink.mutate({ userId: activeUserId, discountType: 'byu' })}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  BYU Discount Subscription ($29/yr)
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Templates Modal */}
      <Dialog open={templatesModalOpen} onOpenChange={setTemplatesModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 mt-4 max-h-[60vh] overflow-auto pr-2">
            {!templates ? (
              <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
            ) : templates.length === 0 ? (
              <div className="text-center text-slate-500 py-4">No templates found. Add some in Settings.</div>
            ) : templates.map(t => (
              <Button
                key={t.id}
                variant="outline"
                className="w-full justify-start text-left h-auto py-3 px-4"
                onClick={() => {
                  // This is a placeholder since injecting into chat depends on the chat thread component
                  // In a real implementation we might use a global event or Zustand store.
                  window.dispatchEvent(new CustomEvent('insert-template', { detail: t.text }));
                  setTemplatesModalOpen(false);
                }}
              >
                <div>
                  <div className="font-bold text-slate-700">{t.name}</div>
                  <div className="text-xs text-slate-500 font-normal mt-1 whitespace-pre-wrap">{t.text}</div>
                </div>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <DialerModal
        isOpen={dialerOpen && !isCallActive}
        onClose={() => setDialerOpen(false)}
        prefillNumber={dialerPrefill}
        callStatus={voice.status}
        callDuration={voice.callDuration}
        isMuted={voice.isMuted}
        isRecordingPaused={voice.isRecordingPaused}
        onDial={voice.makeCall}
        onHangUp={voice.hangUp}
        onToggleMute={voice.toggleMute}
        onToggleRecordingPause={voice.toggleRecordingPause}
      />

      <VideoCallModal 
        isOpen={videoModalOpen} 
        onClose={() => setVideoModalOpen(false)} 
        roomName={activeVideoRoom} 
        identity="Admin" 
      />

      {fullscreenImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setFullscreenImage(null)}
        >
          <img 
            src={fullscreenImage} 
            alt="Fullscreen Attachment" 
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </>
  );
}
