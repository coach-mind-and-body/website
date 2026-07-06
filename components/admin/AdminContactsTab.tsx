import { useState, useEffect } from "react";
import { Users, Video, Calendar, Bell, ChevronRight, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { useInbox } from "./messaging/InboxContext";
import AdminClientSessions from "../AdminClientSessions";
import AdminModuleAssignment from "../AdminModuleAssignment";
import AdminClientHabits from "../AdminClientHabits";
import { toast } from "sonner";

const PAGE_SIZE = 25;

export function AdminContactsTab({ gcalConnected }: { gcalConnected: boolean }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<"all" | "reclaim" | "habit" | "leads">("all");
  const { data: contactsPage, isLoading, refetch } = trpc.leads.unifiedContacts.useQuery({
    search: search.trim() || undefined,
    page,
    pageSize: PAGE_SIZE,
    filter,
  });
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const { setActiveChatMeta, setIsNewChatOpen, setNewChatPrefill } = useInbox();

  // Edit details state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editNotes, setEditNotes] = useState("");

  useEffect(() => {
    if (selectedContact) {
      setEditName(selectedContact.name || "");
      setEditPhone(selectedContact.phone || "");
      setEditNotes(selectedContact.notes || "");
      setIsEditing(false);
    }
  }, [selectedContact]);

  const updateContactDetails = trpc.leads.updateContactDetails.useMutation({
    onSuccess: () => {
      toast.success("Contact details updated!");
      setIsEditing(false);
      refetch();
      setSelectedContact((prev: any) => ({
        ...prev,
        name: editName,
        phone: editPhone || null,
        notes: editNotes || null,
      }));
    },
    onError: (e) => toast.error("Failed to update contact: " + e.message),
  });

  const getOrCreateConversation = trpc.messaging.getOrCreateConversation.useMutation({
    onSuccess: (data) => {
      setActiveChatMeta({
        conversationId: data.conversationId,
        userId: selectedContact?.userId ?? null,
        contactPhone: selectedContact?.phone ?? "",
        userName: selectedContact?.name ?? "Customer",
      });
      setSelectedContact(null);
    },
    onError: (e) => toast.error("Failed to start conversation: " + e.message)
  });

  const updateLeadStatus = trpc.leads.updateStatus.useMutation({
    onSuccess: () => { toast.success("Status updated!"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const contacts = contactsPage?.items ?? [];
  const total = contactsPage?.total ?? 0;
  const totalPages = contactsPage?.totalPages ?? 1;
  const currentPage = contactsPage?.page ?? page;
  const rangeStart = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, total);

  if (isLoading) return <div className="text-sm" style={{ color: "oklch(0.52 0.015 50)" }}>Loading unified CRM contacts...</div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <h2 className="font-bold text-2xl" style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.20 0.015 50)" }}>Unified Contacts</h2>
        <input
          type="search"
          placeholder="Search by name, email, or phone..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full sm:w-64 px-4 py-2 rounded-full text-sm border"
          style={{ background: "oklch(1 0 0)", borderColor: "oklch(0.90 0.015 80)", color: "oklch(0.20 0.015 50)" }}
        />
        <div className="flex items-center gap-2 p-1 rounded-full" style={{ background: "oklch(0.96 0.025 50)" }}>
          {([
            { id: "all", label: "All" },
            { id: "reclaim", label: "Reclaim Clients" },
            { id: "habit", label: "Habit Tracker" },
            { id: "leads", label: "Leads" }
          ] as const).map(t => (
            <button
              key={t.id}
              onClick={() => {
                setFilter(t.id);
                setPage(1);
              }}
              className="px-4 py-1.5 rounded-full text-xs font-bold transition-all"
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
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm" style={{ color: "oklch(0.52 0.015 50)" }}>
          {total === 0 ? "0 of 0 contacts" : `${rangeStart}–${rangeEnd} of ${total} contacts`}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-40"
            style={{ background: "oklch(0.96 0.025 50)", color: "oklch(0.42 0.015 50)" }}
          >
            Previous
          </button>
          <span className="text-xs font-semibold" style={{ color: "oklch(0.52 0.015 50)" }}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-40"
            style={{ background: "oklch(0.96 0.025 50)", color: "oklch(0.42 0.015 50)" }}
          >
            Next
          </button>
        </div>
      </div>
      <div className="space-y-3">
        {contacts.map((contact: any) => (
          <button
            key={contact.email}
            onClick={() => setSelectedContact(contact)}
            className="w-full text-left rounded-xl p-5 flex items-center justify-between transition-all hover:-translate-y-0.5"
            style={{ background: "oklch(1 0 0)" }}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: "oklch(0.72 0.12 75)", color: "oklch(1 0 0)" }}>
                {(contact.name?.[0] ?? "?").toUpperCase()}
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
                background: contact.highestStatus === "reclaim" ? "oklch(0.92 0.04 148)" : contact.highestStatus === "discovery" ? "oklch(0.93 0.06 75)" : contact.highestStatus === "habit-only" ? "oklch(0.20 0.015 50)" : "oklch(0.985 0.008 80)",
                color: contact.highestStatus === "reclaim" ? "oklch(0.38 0.10 148)" : contact.highestStatus === "discovery" ? "oklch(0.45 0.12 65)" : contact.highestStatus === "habit-only" ? "oklch(0.96 0.025 50)" : "oklch(0.42 0.015 50)",
              }}>
                {contact.highestStatus === "reclaim" ? "Reclaim Client" : contact.highestStatus === "discovery" ? "Discovery Call" : contact.highestStatus === "fpu" ? "FPU Interest" : contact.highestStatus === "habit-only" ? "Habit Tracker" : "Subscriber"}
              </span>
              <ChevronRight size={16} style={{ color: "oklch(0.52 0.015 50)" }} />
            </div>
          </button>
        ))}
      </div>

      <Dialog open={!!selectedContact} onOpenChange={(open) => !open && setSelectedContact(null)}>
        <DialogContent
          aria-describedby={undefined}
          className="w-[96vw] sm:max-w-[min(96vw,1600px)] max-h-[90vh] overflow-y-auto p-6 md:p-8"
          style={{ background: "oklch(0.96 0.025 50)", border: "1px solid oklch(0.90 0.015 80)" }}
        >
          {selectedContact && (
            <>
              <DialogHeader className="w-full text-left pr-10">
                <div className="flex flex-wrap items-center justify-between gap-4 w-full">
                  <div className="min-w-0 flex-1">
                    <DialogTitle style={{ color: "oklch(0.20 0.015 50)", fontSize: "1.5rem", fontFamily: "'Cormorant Garamond', serif" }}>
                      {selectedContact.name}
                    </DialogTitle>
                    <p className="text-sm mt-1 flex flex-wrap items-center gap-x-3 gap-y-1" style={{ color: "oklch(0.52 0.015 50)" }}>
                      <span className="break-all">{selectedContact.email}</span>
                      {selectedContact.phone && <span className="shrink-0">• {selectedContact.phone}</span>}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (!selectedContact.phone) {
                        setNewChatPrefill({ 
                          name: selectedContact.name, 
                          phone: selectedContact.phone || undefined, 
                          userId: selectedContact.userId || undefined 
                        });
                        setIsNewChatOpen(true);
                        setSelectedContact(null);
                      } else {
                        getOrCreateConversation.mutate({ phone: selectedContact.phone });
                      }
                    }}
                    disabled={getOrCreateConversation.isPending}
                    className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow hover:-translate-y-0.5 whitespace-nowrap"
                    style={{ background: "oklch(0.20 0.015 50)", color: "white" }}
                  >
                    {getOrCreateConversation.isPending ? "Opening..." : "Send Message"}
                  </button>
                </div>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 mt-6">
                {/* Left column: Contact Info Details and Editing Form */}
                <div className="md:col-span-4 space-y-6">
                  <div className="bg-white rounded-xl shadow p-5 border border-slate-100 space-y-4">
                    <div className="flex justify-between items-center border-b pb-3 mb-2">
                      <h3 className="font-bold text-lg" style={{ color: "oklch(0.20 0.015 50)", fontFamily: "'Cormorant Garamond', serif" }}>
                        Contact Info
                      </h3>
                      {!isEditing && (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="text-xs font-bold underline transition-colors hover:opacity-80"
                          style={{ color: "oklch(0.72 0.12 75)" }}
                        >
                          Edit Info
                        </button>
                      )}
                    </div>

                    {!isEditing ? (
                      <div className="space-y-3 text-sm">
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider block mb-0.5" style={{ color: "oklch(0.52 0.015 50)" }}>Name</span>
                          <p className="font-semibold text-slate-800">{selectedContact.name}</p>
                        </div>
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider block mb-0.5" style={{ color: "oklch(0.52 0.015 50)" }}>Email</span>
                          <p className="text-slate-600 break-all">{selectedContact.email}</p>
                        </div>
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider block mb-0.5" style={{ color: "oklch(0.52 0.015 50)" }}>Phone</span>
                          <p className="text-slate-600">{selectedContact.phone || "No phone number"}</p>
                        </div>
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider block mb-0.5" style={{ color: "oklch(0.52 0.015 50)" }}>Notes</span>
                          <p className="text-slate-700 italic bg-slate-50 p-3 rounded-lg border border-slate-100 whitespace-pre-wrap">
                            {selectedContact.notes || "No notes yet."}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "oklch(0.52 0.015 50)" }}>Name</label>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-lg border bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
                            style={{ borderColor: "oklch(0.90 0.015 80)" }}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "oklch(0.52 0.015 50)" }}>Phone</label>
                          <input
                            type="text"
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            placeholder="e.g. +14358285621"
                            className="w-full px-3 py-2 text-sm rounded-lg border bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
                            style={{ borderColor: "oklch(0.90 0.015 80)" }}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "oklch(0.52 0.015 50)" }}>Notes</label>
                          <textarea
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            placeholder="Add relationship notes, habits details, etc..."
                            rows={5}
                            className="w-full px-3 py-2 text-sm rounded-lg border bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue resize-none"
                            style={{ borderColor: "oklch(0.90 0.015 80)" }}
                          />
                        </div>
                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => {
                              updateContactDetails.mutate({
                                email: selectedContact.email,
                                name: editName,
                                phone: editPhone || null,
                                notes: editNotes || null,
                                leadId: selectedContact.leadId || null,
                                userId: selectedContact.userId || null,
                              });
                            }}
                            disabled={updateContactDetails.isPending}
                            className="px-4 py-2 rounded-lg font-bold text-xs shadow text-white flex-1 transition-all hover:opacity-90 disabled:opacity-50"
                            style={{ background: "oklch(0.72 0.12 75)" }}
                          >
                            {updateContactDetails.isPending ? "Saving..." : "Save Changes"}
                          </button>
                          <button
                            onClick={() => {
                              setIsEditing(false);
                              setEditName(selectedContact.name || "");
                              setEditPhone(selectedContact.phone || "");
                              setEditNotes(selectedContact.notes || "");
                            }}
                            className="px-4 py-2 rounded-lg font-bold text-xs border flex-1 transition-all hover:bg-slate-50"
                            style={{ borderColor: "oklch(0.90 0.015 80)", color: "oklch(0.52 0.015 50)" }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right column: Timeline & Sessions */}
                <div className="md:col-span-8 space-y-8 min-w-0">
                  <div>
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
                    <div className="p-5 rounded-xl border" style={{ borderColor: "oklch(0.90 0.015 80)", background: "oklch(0.96 0.025 50)" }}>
                      <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "oklch(0.52 0.015 50)" }}>Discovery Call Management</p>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="text-sm" style={{ color: "oklch(0.20 0.015 50)" }}>Current Status: <strong className="capitalize">{selectedContact.leadStatus}</strong></span>
                        <button 
                          onClick={() => {
                            updateLeadStatus.mutate({ id: selectedContact.leadId, status: "enrolled" });
                            setSelectedContact({ ...selectedContact, leadStatus: "enrolled", highestStatus: "reclaim" });
                          }}
                          disabled={updateLeadStatus.isPending}
                          className="shrink-0 px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap"
                          style={{ background: "oklch(0.72 0.12 75)", color: "oklch(1 0 0)" }}
                        >
                          {updateLeadStatus.isPending ? "Updating..." : "Mark as Enrolled"}
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedContact.enrollmentId && selectedContact.highestStatus !== 'habit-only' && (
                    <div className="border-t pt-6" style={{ borderColor: "oklch(0.90 0.015 80)" }}>
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
                    <div className="border-t pt-6" style={{ borderColor: "oklch(0.90 0.015 80)" }}>
                      <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "oklch(0.52 0.015 50)" }}>Habit Progress</p>
                      <AdminClientHabits userId={selectedContact.userId} />
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
