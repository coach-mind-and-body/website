import { useState } from "react";
import { Users, Video, Calendar, Bell, ChevronRight, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import AdminClientSessions from "../AdminClientSessions";
import { toast } from "sonner";

export function AdminContactsTab({ gcalConnected }: { gcalConnected: boolean }) {
  const { data: contacts, isLoading, refetch } = trpc.leads.unifiedContacts.useQuery();
  const [selectedContact, setSelectedContact] = useState<any>(null);

  const updateLeadStatus = trpc.leads.updateStatus.useMutation({
    onSuccess: () => { toast.success("Status updated!"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) return <div className="text-sm" style={{ color: "oklch(0.55 0.02 160)" }}>Loading unified CRM contacts...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-bold text-2xl" style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.97 0.008 10)" }}>Unified Contacts</h2>
      </div>
      <div className="space-y-3">
        {(contacts ?? []).map((contact: any) => (
          <button
            key={contact.email}
            onClick={() => setSelectedContact(contact)}
            className="w-full text-left rounded-xl p-5 flex items-center justify-between transition-all hover:-translate-y-0.5"
            style={{ background: "oklch(0.22 0.02 160)" }}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: "oklch(0.72 0.12 75)", color: "oklch(0.22 0.02 160)" }}>
                {contact.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-base mb-1" style={{ color: "oklch(0.97 0.008 10)" }}>{contact.name}</p>
                <div className="flex items-center gap-3">
                  <p className="text-xs" style={{ color: "oklch(0.60 0.02 160)" }}>{contact.email}</p>
                  {contact.phone && <p className="text-xs" style={{ color: "oklch(0.60 0.02 160)" }}>• {contact.phone}</p>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs px-2 py-1 rounded-full font-bold" style={{
                background: contact.highestStatus === "reclaim" ? "oklch(0.92 0.04 148)" : contact.highestStatus === "discovery" ? "oklch(0.93 0.06 75)" : "oklch(0.28 0.02 160)",
                color: contact.highestStatus === "reclaim" ? "oklch(0.38 0.10 148)" : contact.highestStatus === "discovery" ? "oklch(0.45 0.12 65)" : "oklch(0.70 0.02 160)",
              }}>
                {contact.highestStatus === "reclaim" ? "Reclaim Client" : contact.highestStatus === "discovery" ? "Discovery Call" : contact.highestStatus === "fpu" ? "FPU Interest" : "Subscriber"}
              </span>
              <ChevronRight size={16} style={{ color: "oklch(0.60 0.02 160)" }} />
            </div>
          </button>
        ))}
      </div>

      <Dialog open={!!selectedContact} onOpenChange={(open) => !open && setSelectedContact(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" style={{ background: "oklch(0.18 0.02 160)", border: "1px solid oklch(0.30 0.02 160)" }}>
          {selectedContact && (
            <>
              <DialogHeader>
                <DialogTitle style={{ color: "oklch(0.97 0.008 10)", fontSize: "1.5rem", fontFamily: "'Cormorant Garamond', serif" }}>
                  {selectedContact.name}
                </DialogTitle>
                <p className="text-sm" style={{ color: "oklch(0.60 0.02 160)" }}>{selectedContact.email} {selectedContact.phone && `• ${selectedContact.phone}`}</p>
              </DialogHeader>

              <div className="mt-6">
                <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "oklch(0.60 0.02 160)" }}>Journey Timeline</p>
                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-[oklch(0.30_0.02_160)] before:to-transparent">
                  {selectedContact.timeline.map((event: any, i: number) => (
                    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active" key={i}>
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2" style={{ background: "oklch(0.18 0.02 160)", borderColor: "oklch(0.30 0.02 160)" }}>
                        <CheckCircle2 size={16} style={{ color: "oklch(0.72 0.12 75)" }} />
                      </div>
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl shadow" style={{ background: "oklch(0.22 0.02 160)" }}>
                        <div className="flex items-center justify-between mb-1">
                          <time className="text-xs font-semibold" style={{ color: "oklch(0.72 0.12 75)" }}>{new Date(event.date).toLocaleDateString()}</time>
                        </div>
                        <div className="text-sm font-semibold" style={{ color: "oklch(0.97 0.008 10)" }}>{event.action}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedContact.leadId && selectedContact.leadStatus !== 'enrolled' && (
                <div className="mt-8 p-5 rounded-xl border" style={{ borderColor: "oklch(0.30 0.02 160)", background: "oklch(0.20 0.02 160)" }}>
                  <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "oklch(0.60 0.02 160)" }}>Discovery Call Management</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: "oklch(0.97 0.008 10)" }}>Current Status: <strong className="capitalize">{selectedContact.leadStatus}</strong></span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                           updateLeadStatus.mutate({ id: selectedContact.leadId, status: "enrolled" });
                           setSelectedContact({ ...selectedContact, leadStatus: "enrolled", highestStatus: "reclaim" });
                        }}
                        disabled={updateLeadStatus.isPending}
                        className="px-4 py-2 text-xs font-bold rounded-lg transition-all"
                        style={{ background: "oklch(0.72 0.12 75)", color: "oklch(0.18 0.02 160)" }}
                      >
                        {updateLeadStatus.isPending ? "Updating..." : "Mark as Enrolled"}
                      </button>
                    </div>
                  </div>
                  {selectedContact.notes && (
                    <p className="mt-3 text-sm italic" style={{ color: "oklch(0.65 0.02 160)" }}>"{selectedContact.notes}"</p>
                  )}
                </div>
              )}

              {selectedContact.enrollmentId && (
                <div className="mt-8 border-t pt-6" style={{ borderColor: "oklch(0.30 0.02 160)" }}>
                  <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "oklch(0.60 0.02 160)" }}>Reclaim Session Management</p>
                  <AdminClientSessions
                    enrollmentId={selectedContact.enrollmentId}
                    gcalConnected={gcalConnected}
                  />
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
