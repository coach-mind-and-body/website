import { useState } from "react";
import { Users, Video, Calendar, Bell, ChevronRight, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import AdminClientSessions from "../AdminClientSessions";
import AdminModuleAssignment from "../AdminModuleAssignment";
import AdminClientHabits from "../AdminClientHabits";
import { toast } from "sonner";

export function AdminContactsTab({ gcalConnected }: { gcalConnected: boolean }) {
  const { data: contacts, isLoading, refetch } = trpc.leads.unifiedContacts.useQuery();
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [filter, setFilter] = useState<"all" | "reclaim" | "habit" | "leads">("all");

  const updateLeadStatus = trpc.leads.updateStatus.useMutation({
    onSuccess: () => { toast.success("Status updated!"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) return <div className="text-sm" style={{ color: "oklch(0.52 0.015 50)" }}>Loading unified CRM contacts...</div>;

  const filteredContacts = (contacts ?? []).filter((c: any) => {
    if (filter === "all") return true;
    if (filter === "reclaim") return c.highestStatus === "reclaim";
    if (filter === "habit") return c.highestStatus === "habit-only";
    if (filter === "leads") return ["discovery", "fpu", "subscriber"].includes(c.highestStatus);
    return true;
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <h2 className="font-bold text-2xl" style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.20 0.015 50)" }}>Unified Contacts</h2>
        <div className="flex items-center gap-2 p-1 rounded-lg" style={{ background: "oklch(0.96 0.025 50)" }}>
          {([
            { id: "all", label: "All" },
            { id: "reclaim", label: "Reclaim Clients" },
            { id: "habit", label: "Habit Tracker" },
            { id: "leads", label: "Leads" }
          ] as const).map(t => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              className="px-3 py-1.5 rounded-md text-xs font-bold transition-all"
              style={{
                background: filter === t.id ? "oklch(1 0 0)" : "transparent",
                color: filter === t.id ? "oklch(0.20 0.015 50)" : "oklch(0.52 0.015 50)",
                boxShadow: filter === t.id ? "0 1px 2px rgba(0,0,0,0.05)" : "none"
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        {filteredContacts.map((contact: any) => (
          <button
            key={contact.email}
            onClick={() => setSelectedContact(contact)}
            className="w-full text-left rounded-xl p-5 flex items-center justify-between transition-all hover:-translate-y-0.5"
            style={{ background: "oklch(1 0 0)" }}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: "oklch(0.72 0.12 75)", color: "oklch(1 0 0)" }}>
                {contact.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-base mb-1" style={{ color: "oklch(0.20 0.015 50)" }}>{contact.name}</p>
                <div className="flex items-center gap-3">
                  <p className="text-xs" style={{ color: "oklch(0.52 0.015 50)" }}>{contact.email}</p>
                  {contact.phone && <p className="text-xs" style={{ color: "oklch(0.52 0.015 50)" }}>• {contact.phone}</p>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs px-2 py-1 rounded-full font-bold" style={{
                background: contact.highestStatus === "reclaim" ? "oklch(0.92 0.04 148)" : contact.highestStatus === "discovery" ? "oklch(0.93 0.06 75)" : contact.highestStatus === "habit-only" ? "oklch(0.96 0.025 50)" : "oklch(0.985 0.008 80)",
                color: contact.highestStatus === "reclaim" ? "oklch(0.38 0.10 148)" : contact.highestStatus === "discovery" ? "oklch(0.45 0.12 65)" : contact.highestStatus === "habit-only" ? "oklch(0.72 0.12 75)" : "oklch(0.42 0.015 50)",
              }}>
                {contact.highestStatus === "reclaim" ? "Reclaim Client" : contact.highestStatus === "discovery" ? "Discovery Call" : contact.highestStatus === "fpu" ? "FPU Interest" : contact.highestStatus === "habit-only" ? "Habit Tracker" : "Subscriber"}
              </span>
              <ChevronRight size={16} style={{ color: "oklch(0.52 0.015 50)" }} />
            </div>
          </button>
        ))}
      </div>

      <Dialog open={!!selectedContact} onOpenChange={(open) => !open && setSelectedContact(null)}>
        <DialogContent className="max-w-5xl w-[90vw] max-h-[85vh] overflow-y-auto" style={{ background: "oklch(0.96 0.025 50)", border: "1px solid oklch(0.90 0.015 80)" }}>
          {selectedContact && (
            <>
              <DialogHeader>
                <DialogTitle style={{ color: "oklch(0.20 0.015 50)", fontSize: "1.5rem", fontFamily: "'Cormorant Garamond', serif" }}>
                  {selectedContact.name}
                </DialogTitle>
                <p className="text-sm" style={{ color: "oklch(0.52 0.015 50)" }}>{selectedContact.email} {selectedContact.phone && `• ${selectedContact.phone}`}</p>
              </DialogHeader>

              <div className="mt-6">
                <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "oklch(0.52 0.015 50)" }}>Journey Timeline</p>
                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-[oklch(0.90_0.015_80)] before:to-transparent">
                  {selectedContact.timeline.map((event: any, i: number) => (
                    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active" key={i}>
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2" style={{ background: "oklch(0.96 0.025 50)", borderColor: "oklch(0.90 0.015 80)" }}>
                        <CheckCircle2 size={16} style={{ color: "oklch(0.72 0.12 75)" }} />
                      </div>
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl shadow" style={{ background: "oklch(1 0 0)" }}>
                        <div className="flex items-center justify-between mb-1">
                          <time className="text-xs font-semibold" style={{ color: "oklch(0.72 0.12 75)" }}>{new Date(event.date).toLocaleDateString()}</time>
                        </div>
                        <div className="text-sm font-semibold" style={{ color: "oklch(0.20 0.015 50)" }}>{event.action}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedContact.leadId && selectedContact.leadStatus !== 'enrolled' && (
                <div className="mt-8 p-5 rounded-xl border" style={{ borderColor: "oklch(0.90 0.015 80)", background: "oklch(0.96 0.025 50)" }}>
                  <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "oklch(0.52 0.015 50)" }}>Discovery Call Management</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: "oklch(0.20 0.015 50)" }}>Current Status: <strong className="capitalize">{selectedContact.leadStatus}</strong></span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                           updateLeadStatus.mutate({ id: selectedContact.leadId, status: "enrolled" });
                           setSelectedContact({ ...selectedContact, leadStatus: "enrolled", highestStatus: "reclaim" });
                        }}
                        disabled={updateLeadStatus.isPending}
                        className="px-4 py-2 text-xs font-bold rounded-lg transition-all"
                        style={{ background: "oklch(0.72 0.12 75)", color: "oklch(1 0 0)" }}
                      >
                        {updateLeadStatus.isPending ? "Updating..." : "Mark as Enrolled"}
                      </button>
                    </div>
                  </div>
                  {selectedContact.notes && (
                    <p className="mt-3 text-sm italic" style={{ color: "oklch(0.42 0.015 50)" }}>"{selectedContact.notes}"</p>
                  )}
                </div>
              )}

              {selectedContact.enrollmentId && selectedContact.highestStatus !== 'habit-only' && (
                <div className="mt-8 border-t pt-6" style={{ borderColor: "oklch(0.90 0.015 80)" }}>
                  <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "oklch(0.52 0.015 50)" }}>Reclaim Session Management</p>
                  <AdminClientSessions
                    enrollmentId={selectedContact.enrollmentId}
                    gcalConnected={gcalConnected}
                  />
                  <p className="text-xs font-bold uppercase tracking-widest mt-6 mb-2" style={{ color: "oklch(0.52 0.015 50)" }}>Module Assignment</p>
                  <AdminModuleAssignment userId={selectedContact.userId} />
                </div>
              )}

              {selectedContact.userId && selectedContact.shareHabitsWithCoach && (
                <div className="mt-8 border-t pt-6" style={{ borderColor: "oklch(0.90 0.015 80)" }}>
                  <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "oklch(0.52 0.015 50)" }}>Habit Progress</p>
                  <AdminClientHabits userId={selectedContact.userId} />
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
