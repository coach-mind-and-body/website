const fs = require('fs');

const file = 'app/admin/inbox/components/InboxModals.tsx';
const safeContent = `"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useInbox } from "../InboxContext";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import NewChatComposeModal from "./NewChatComposeModal";

export default function InboxModals() {
  const {
    templatesModalOpen, setTemplatesModalOpen,
    fullscreenImage, setFullscreenImage,
  } = useInbox();

  const { data: templates } = trpc.templates.list.useQuery();

  return (
    <>
      <NewChatComposeModal />

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
`;

fs.writeFileSync(file, safeContent, 'utf8');
