// @ts-nocheck
"use client";

import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useInbox } from "./InboxContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import Link from "next/link";
import { Plane, Check, Edit2, Phone, Mail, Users, Tag, Plus, Loader2, Workflow, FileText, Clock, CreditCard } from "lucide-react";
import { useInboxPollInterval } from "@/lib/useInboxPollInterval";
import { toast } from "sonner";

export default function CustomerProfilePane({ chatId }: { chatId: number }) {
  if (chatId === -1) {
    return (
      <div className="hidden lg:flex w-[320px] flex-col border-l bg-slate-50 shrink-0 p-6 text-center text-slate-400 justify-center items-center">
        <Users className="h-12 w-12 mb-4 text-slate-300" />
        <p className="text-sm">Customer details will appear here once the conversation is created.</p>
      </div>
    );
  }
  return <CustomerProfilePaneContent chatId={chatId} />;
}

function CustomerProfilePaneContent({ chatId }: { chatId: number }) {
  const utils = trpc.useContext();
  const { setDialerPrefill, setDialerOpen, setFullscreenImage, isProfileOpen, setIsProfileOpen } = useInbox();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");

  const [editingNotes, setEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState("");
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [editingRevenue, setEditingRevenue] = useState(false);
  const [revenueText, setRevenueText] = useState("");
  const [editingDates, setEditingDates] = useState(false);
  const [startDateStr, setStartDateStr] = useState("");
  const [endDateStr, setEndDateStr] = useState("");

  const pollInterval = useInboxPollInterval(5000, 15000);
  const { data: activeChat } = trpc.messaging.getConversation.useQuery({ id: chatId }, {
    refetchInterval: pollInterval
  });

  const activeName = activeChat?.conversation?.userName || activeChat?.conversation?.contactPhone || "Unknown Customer";
  const activePhone = activeChat?.conversation?.contactPhone || "Unknown";

  const allLeads: any[] = [{id:1, name:"Mock"}];
  const activeLead = allLeads.find(q => 
    (q.phone && activePhone !== "Unknown" && q.phone === activePhone) || 
    (q.email && activeChat?.conversation?.contactEmail && q.email === activeChat.conversation.contactEmail)
  );

  const { data: userTags = [] } = trpc.crmAutomations.getUserTags.useQuery(
    { userId: activeChat?.conversation?.userId || 0 }, 
    { enabled: !!activeChat?.conversation?.userId }
  );
  
  const { data: allTags = [] } = trpc.crmAutomations.listTags.useQuery();
  const { data: admins = [] } = trpc.messaging.listAdmins.useQuery();
  const { data: scheduledMessages = [] } = trpc.messaging.listScheduledForConversation.useQuery(
    { conversationId: chatId },
    { enabled: chatId > 0, refetchInterval: pollInterval }
  );

  const contactUserId = activeChat?.conversation?.userId;
  const contactEmail = activeChat?.conversation?.contactEmail;
  const contactPhone = activeChat?.conversation?.contactPhone;

  const { data: enrollments = [] } = trpc.crmAutomations.listEnrollmentsForUser.useQuery(
    { userId: contactUserId || 0 },
    { enabled: !!contactUserId }
  );
  const { data: sequences = [] } = trpc.crmAutomations.listSequences.useQuery();

  const { data: reminders = [] } = trpc.messaging.listRemindersForContact.useQuery(
    {
      userId: contactUserId || undefined,
      phone: contactPhone && contactPhone !== "Unknown" ? contactPhone : undefined,
      email: contactEmail || undefined,
    },
    { enabled: chatId > 0, refetchInterval: pollInterval }
  );

  const { data: payments = [] } = trpc.messaging.listPaymentsForContact.useQuery(
    {
      userId: contactUserId || undefined,
      email: contactEmail || undefined,
    },
    { enabled: chatId > 0 && !!(contactUserId || contactEmail) }
  );

  const enrollInSequence = trpc.crmAutomations.enrollInSequence.useMutation({
    onSuccess: () => {
      utils.crmAutomations.listEnrollmentsForUser.invalidate();
      toast.success("Enrolled in sequence!");
    },
    onError: (err) => toast.error(err.message),
  });

  // Mutations
  const updateContact = trpc.messaging.updateContact.useMutation({
    onSuccess: () => {
      utils.messaging.listConversations.invalidate();
      utils.messaging.getConversation.invalidate();
      setIsEditingProfile(false);
      toast.success("Contact updated!");
    }
  });

  const assignConversation = trpc.messaging.assignConversation.useMutation({
    onSuccess: () => {
      utils.messaging.listConversations.invalidate();
      utils.messaging.getConversation.invalidate();
      toast.success("Conversation assigned!");
    }
  });

  const addUserTag = trpc.crmAutomations.addUserTag.useMutation({
    onSuccess: () => {
      utils.crmAutomations.getUserTags.invalidate();
      toast.success("Tag added");
    }
  });

  const removeUserTag = trpc.crmAutomations.removeUserTag.useMutation({
    onSuccess: () => {
      utils.crmAutomations.getUserTags.invalidate();
      toast.success("Tag removed");
    }
  });

  const updateStatus = { mutate: (args: any) => {} };

  const createPipelineLead = { mutate: (args: any) => {} };

  const updateNotes = { mutate: (args: any) => {} };

  const updateTripDates = { mutate: (args: any) => {} };

  const updateRevenue = { mutate: (args: any) => {} };

  const renderContent = () => (
    <div className="flex-col bg-background shrink-0 flex overflow-hidden h-full">
      <div className="p-6 border-b">
        <div className="flex justify-between items-start mb-4">
          {isEditingProfile ? (
            <Input 
              value={editName} 
              onChange={(e) => setEditName(e.target.value)} 
              placeholder="Full Name" 
              className="font-bold text-lg h-8 px-2"
              autoFocus
            />
          ) : (
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-bold text-slate-800 truncate pr-2 flex items-center gap-2">
                {activeName}
                {activeChat?.conversation?.isPremium && <Plane className="h-5 w-5 text-amber-500 fill-amber-500 shrink-0" />}
              </h2>
              {activeChat?.conversation?.isPremium && (
                <Badge variant="default" className="bg-amber-500 hover:bg-amber-600 w-fit text-[10px] uppercase tracking-wide">
                  Premium Subscriber
                </Badge>
              )}
            </div>
          )}
          <Button variant="ghost" size="icon" className="-mt-1 shrink-0" onClick={() => {
            if (isEditingProfile) {
              if (editPhone.trim()) {
                updateContact.mutate({ 
                  conversationId: chatId,
                  phone: editPhone, 
                  name: editName, 
                  email: editEmail 
                });
              } else {
                toast.error("Phone number is required");
              }
            } else {
              setEditName(activeName === "Unknown Customer" ? "" : activeName);
              setEditPhone(activePhone === "Unknown" ? "" : activePhone);
              setEditEmail(activeChat?.conversation?.contactEmail || "");
              setIsEditingProfile(true);
            }
          }}>
            {isEditingProfile ? <Check className="h-4 w-4 text-emerald-600" /> : <Edit2 className="h-4 w-4 text-muted-foreground" />}
          </Button>
        </div>
        
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <Phone className="h-4 w-4 shrink-0" />
            {isEditingProfile ? (
              <Input 
                value={editPhone} 
                onChange={(e) => setEditPhone(e.target.value)} 
                placeholder="Phone Number" 
                className="h-7 text-xs px-2"
              />
            ) : (
              <button 
                className="truncate text-brand-blue hover:underline text-left"
                onClick={() => {
                  if (activeChat?.conversation?.platform !== 'facebook' && activeChat?.conversation?.platform !== 'instagram') {
                    setDialerPrefill(activePhone !== "Unknown" ? activePhone : "");
                    setDialerOpen(true);
                  }
                }}
              >
                {activeChat?.conversation?.platform === 'facebook' || activeChat?.conversation?.platform === 'instagram' ? 'Meta PSID: ' + activePhone.slice(0,6) + '...' : activePhone}
              </button>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <Mail className="h-4 w-4 shrink-0" />
            {isEditingProfile ? (
              <Input 
                value={editEmail} 
                onChange={(e) => setEditEmail(e.target.value)} 
                placeholder="Email Address" 
                className="h-7 text-xs px-2"
              />
            ) : (
              <span className="truncate">{activeChat?.conversation?.contactEmail || "No email provided"}</span>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
            <Users className="h-4 w-4" />
            <span>Assigned To</span>
          </div>
          <Select 
            value={activeChat?.conversation?.assignedToId?.toString() || "unassigned"}
            onValueChange={(val) => {
              assignConversation.mutate({ 
                conversationId: chatId, 
                adminId: val === "unassigned" ? null : parseInt(val) 
              });
            }}
          >
            <SelectTrigger className="h-8 text-xs bg-slate-50">
              <SelectValue placeholder="Assign agent..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {admins.map(admin => (
                <SelectItem key={admin.id} value={admin.id.toString()}>
                  {admin.name || admin.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 mt-6">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
            <Tag className="h-4 w-4" />
            <span>Tags</span>
          </div>
          
          {activeChat?.conversation?.userId ? (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                {userTags.map(t => (
                  <Badge 
                    key={t.id} 
                    variant="outline" 
                    className="bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
                    onClick={() => removeUserTag.mutate({ userId: activeChat.conversation!.userId!, tagId: t.id })}
                  >
                    {t.name} <span className="ml-1 opacity-50 hover:opacity-100">&times;</span>
                  </Badge>
                ))}
                {userTags.length === 0 && (
                  <span className="text-xs text-slate-400">No tags assigned.</span>
                )}
              </div>
              
              <Select onValueChange={(val) => {
                addUserTag.mutate({ userId: activeChat.conversation!.userId!, tagId: parseInt(val) });
              }}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Add a tag..." />
                </SelectTrigger>
                <SelectContent>
                  {allTags.map(t => (
                    <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <p className="text-xs text-slate-400">No site account matched — tags require a linked signup (matched by phone or email).</p>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        <Accordion type="multiple" defaultValue={["pipeline", "scheduled"]} className="w-full">
          <AccordionItem value="pipeline" className="border-b-0 px-4">
            <AccordionTrigger className="hover:no-underline text-sm font-semibold py-4">
              Pipeline Stage {activeLead && <Badge variant="outline" className="ml-2 bg-brand-blue/10 text-brand-blue capitalize">{activeLead.status}</Badge>}
            </AccordionTrigger>
            <AccordionContent className="pb-4 space-y-3">
              {activeLead ? (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground mb-2">Change current pipeline stage:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {["new", "contacted", "quoted", "booked", "completed"].map((status) => (
                      <Button 
                        key={status}
                        variant={activeLead.status === status ? "default" : "outline"}
                        size="sm"
                        className="capitalize text-xs justify-start"
                        disabled={updateStatus.isPending}
                        onClick={() => updateStatus.mutate({ id: activeLead.id, status: status as any })}
                      >
                        {status}
                      </Button>
                    ))}
                  </div>
                  <Button 
                    variant="outline"
                    className="w-full justify-start mt-2 border-slate-300 text-slate-700 bg-white"
                    onClick={() => {
                      window.open(`/admin/itineraries?quoteId=${activeLead.id}`, "_blank");
                    }}
                  >
                    <Plane className="w-4 h-4 mr-2" /> Edit Itinerary
                  </Button>
                  <Button variant="outline" className="w-full justify-start mt-2 border-brand-blue/30 text-brand-blue bg-brand-blue/5" asChild>
                    <Link href={`/admin/v2-inbox/pipeline?leadId=${activeLead.id}`}>
                      <Workflow className="w-4 h-4 mr-2" /> Open in Pipeline
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start mt-2 border-brand-orange/30 text-brand-orange bg-brand-orange/5" asChild>
                    <Link href={`/admin/v2-inbox/pipeline?leadId=${activeLead.id}`}>
                      <FileText className="w-4 h-4 mr-2" /> Build Proposal
                    </Link>
                  </Button>
                </div>
              ) : (
                <>
                  <p className="text-xs text-slate-500 mb-2">This customer is not currently in your active pipeline.</p>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-brand-blue border-brand-blue/30 bg-brand-blue/5 hover:bg-brand-blue/10"
                    disabled={createPipelineLead.isPending}
                    onClick={() => {
                      createPipelineLead.mutate({
                        name: activeName,
                        phone: activePhone !== "Unknown" ? activePhone : undefined,
                        notes: "Created from Inbox via text/call.",
                      });
                    }}
                  >
                    {createPipelineLead.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Add to Pipeline
                  </Button>
                </>
              )}
            </AccordionContent>
          </AccordionItem>
          <Separator />
          
          <AccordionItem value="notes" className="border-b-0 px-4">
            <AccordionTrigger className="hover:no-underline text-sm font-semibold py-4">
              CRM Notes
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              {activeLead ? (
                <div className="space-y-2">
                  {!editingNotes ? (
                    <div className="space-y-2">
                      <p className="text-sm text-slate-600 whitespace-pre-wrap bg-slate-50 p-3 rounded-md border min-h-[60px]">
                        {activeLead.notes || <span className="text-slate-400 italic">No notes yet</span>}
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full text-xs"
                        onClick={() => {
                          setEditingNotes(true);
                          setNotesText(activeLead.notes || "");
                        }}
                      >
                        <Edit2 className="w-3 h-3 mr-2" /> Edit Notes
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="relative">
                        <Textarea 
                          value={notesText}
                          onChange={e => {
                            const val = e.target.value;
                            setNotesText(val);
                            
                            const cursorPosition = e.target.selectionStart;
                            const textBeforeCursor = val.slice(0, cursorPosition);
                            const match = textBeforeCursor.match(/@(\w*)$/);
                            if (match) {
                              setMentionQuery(match[1].toLowerCase());
                            } else {
                              setMentionQuery(null);
                            }
                          }}
                          className="w-full border rounded-md p-2 text-sm min-h-[100px] bg-white resize-none focus:outline-none focus:ring-1 focus:ring-slate-300"
                          placeholder="Add a note... (Type @ to mention an admin)"
                        />
                        {mentionQuery !== null && (
                          <div className="absolute bottom-full left-0 mb-1 w-64 bg-white border border-slate-200 rounded-md shadow-lg z-50 py-1 overflow-hidden">
                            {admins.filter(a => a.name?.toLowerCase().includes(mentionQuery) || a.email?.toLowerCase().includes(mentionQuery)).map(admin => (
                              <div 
                                key={admin.id}
                                className="px-3 py-2 text-xs hover:bg-slate-100 cursor-pointer text-slate-800"
                                onClick={() => {
                                  const replaceRegex = /@\w*$/;
                                  setNotesText(notesText.replace(replaceRegex, `@${admin.name?.replace(/\s+/g, '')} `));
                                  setMentionQuery(null);
                                }}
                              >
                                <span className="font-medium">{admin.name}</span>
                                <div className="text-slate-400 text-[10px] truncate">{admin.email}</div>
                              </div>
                            ))}
                            {admins.filter(a => a.name?.toLowerCase().includes(mentionQuery) || a.email?.toLowerCase().includes(mentionQuery)).length === 0 && (
                              <div className="px-3 py-2 text-xs text-slate-400">No admins found</div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="flex-1 text-xs"
                          disabled={updateNotes.isPending}
                          onClick={() => updateNotes.mutate({ id: activeLead.id, notes: notesText })}
                        >
                          {updateNotes.isPending ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : "Save"}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="flex-1 text-xs"
                          onClick={() => setEditingNotes(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic text-center py-4">
                  Add customer to pipeline to take notes.
                </p>
              )}
            </AccordionContent>
          </AccordionItem>
          <Separator />

          {activeLead && (
            <>
              <AccordionItem value="trip-details" className="border-b-0 px-4">
                <AccordionTrigger className="hover:no-underline text-sm font-semibold py-4">
                  Trip Details
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100 mb-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">Scheduled Trip</span>
                      {!editingDates && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 px-2 text-blue-700 hover:bg-blue-100"
                          onClick={() => {
                            setEditingDates(true);
                            const start = (activeLead as any).tripStartDate;
                            const end = (activeLead as any).tripEndDate;
                            setStartDateStr(start ? new Date(start).toISOString().split('T')[0] : "");
                            setEndDateStr(end ? new Date(end).toISOString().split('T')[0] : "");
                          }}
                        >
                          <Edit2 className="w-3 h-3 mr-1" /> Edit
                        </Button>
                      )}
                    </div>
                    
                    {editingDates ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-[10px] text-blue-700 block mb-1">Start Date</span>
                            <Input 
                              type="date" 
                              value={startDateStr}
                              onChange={e => setStartDateStr(e.target.value)}
                              className="h-8 text-xs border-blue-200"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-blue-700 block mb-1">End Date</span>
                            <Input 
                              type="date" 
                              value={endDateStr}
                              onChange={e => setEndDateStr(e.target.value)}
                              className="h-8 text-xs border-blue-200"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <Button 
                            size="sm" 
                            className="flex-1 text-xs bg-blue-600 hover:bg-blue-700 text-white h-7"
                            disabled={updateTripDates.isPending}
                            onClick={() => {
                              const start = startDateStr ? new Date(startDateStr) : null;
                              const end = endDateStr ? new Date(endDateStr) : null;
                              updateTripDates.mutate({ 
                                id: activeLead.id, 
                                tripStartDate: start, 
                                tripEndDate: end 
                              });
                            }}
                          >
                            {updateTripDates.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save Dates"}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="flex-1 text-xs text-blue-700 hover:bg-blue-100 h-7"
                            onClick={() => setEditingDates(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-white p-2 border rounded text-center">
                          <span className="text-[10px] text-slate-500 block uppercase mb-0.5">Depart</span>
                          <span className="text-sm font-semibold text-slate-800">
                            {(activeLead as any).tripStartDate ? new Date((activeLead as any).tripStartDate).toLocaleDateString() : "TBD"}
                          </span>
                        </div>
                        <div className="text-slate-300">-</div>
                        <div className="flex-1 bg-white p-2 border rounded text-center">
                          <span className="text-[10px] text-slate-500 block uppercase mb-0.5">Return</span>
                          <span className="text-sm font-semibold text-slate-800">
                            {(activeLead as any).tripEndDate ? new Date((activeLead as any).tripEndDate).toLocaleDateString() : "TBD"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs">
                    <div>
                      <span className="text-slate-500 block mb-1">Destination</span>
                      <div className="font-medium text-slate-900">{activeLead.destination || <span className="text-slate-400">—</span>}</div>
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-1">Vacation Type</span>
                      <div className="font-medium text-slate-900">{activeLead.vacationType || <span className="text-slate-400">—</span>}</div>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-500 block mb-1">Requested Dates (Form)</span>
                      <div className="font-medium text-slate-900">{activeLead.travelDates || <span className="text-slate-400">—</span>}</div>
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-1">Party Size</span>
                      <div className="font-medium text-slate-900">{activeLead.partySize || <span className="text-slate-400">—</span>}</div>
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-1">Budget</span>
                      <div className="font-medium text-slate-900">{activeLead.budget || <span className="text-slate-400">—</span>}</div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <Separator />

              <AccordionItem value="revenue" className="border-b-0 px-4">
                <AccordionTrigger className="hover:no-underline text-sm font-semibold py-4 text-green-700">
                  Booking Value
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-3">
                    {editingRevenue ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-green-700">$</span>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={revenueText}
                            onChange={e => setRevenueText(e.target.value)}
                            className="h-8 text-sm"
                            placeholder="0.00"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1 text-xs bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => updateRevenue.mutate({ id: activeLead.id, totalRevenue: parseFloat(revenueText) || 0 })}
                            disabled={updateRevenue.isPending}
                          >
                            {updateRevenue.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : "Save"}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="flex-1 text-xs text-green-700 hover:bg-green-100"
                            onClick={() => setEditingRevenue(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="text-xl font-bold text-green-700">
                          {activeLead && (activeLead as any).totalRevenue && parseFloat((activeLead as any).totalRevenue) > 0 ? (
                            `$${parseFloat((activeLead as any).totalRevenue).toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                          ) : (
                            <span className="text-sm text-green-600/70 italic">No revenue recorded</span>
                          )}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 px-2 text-green-700 hover:bg-green-100"
                          onClick={() => {
                            setEditingRevenue(true);
                            setRevenueText(((activeLead as any).totalRevenue || "").toString());
                          }}
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
              <Separator />
            </>
          )}

          <AccordionItem value="scheduled" className="border-b-0 px-4">
            <AccordionTrigger className="hover:no-underline text-sm font-semibold py-4">
              Scheduled messages
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              {scheduledMessages.length === 0 ? (
                <div className="bg-slate-50 border rounded-md p-4 text-center">
                  <p className="text-sm font-medium mb-1">No scheduled messages for this customer.</p>
                  <p className="text-xs text-muted-foreground">
                    When you schedule a future message, it will show up here so you can review or change it before it sends.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {scheduledMessages.map(msg => (
                    <div key={msg.id} className="bg-slate-50 border rounded-md p-3">
                      <p className="text-xs font-semibold text-slate-500 mb-1">
                        {msg.scheduledAt
                          ? new Date(msg.scheduledAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })
                          : "Scheduled"}
                      </p>
                      <p className="text-sm text-slate-700 line-clamp-3">
                        {msg.content || (msg.mediaUrl ? "📷 Image attachment" : "—")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
          <Separator />

          <AccordionItem value="sequences" className="border-b-0 px-4">
            <AccordionTrigger className="hover:no-underline text-sm font-semibold py-4">
              Message sequences {enrollments.length > 0 && <Badge variant="outline" className="ml-2 text-[10px]">{enrollments.length}</Badge>}
            </AccordionTrigger>
            <AccordionContent className="pb-4 space-y-3">
              {!contactUserId ? (
                <p className="text-xs text-slate-500 italic">
                  No site account matched yet. Save a phone or email in the profile that matches their signup, or wait for them to register.
                </p>
              ) : (
                <>
                  {enrollments.length === 0 ? (
                    <p className="text-xs text-slate-500">Not enrolled in any sequences.</p>
                  ) : (
                    <div className="space-y-2">
                      {enrollments.map(e => (
                        <div key={e.id} className="bg-slate-50 border rounded-md p-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium text-slate-800">{e.sequenceName}</span>
                            <Badge variant="outline" className="text-[10px] capitalize">{e.status}</Badge>
                          </div>
                          {e.nextExecutionAt && e.status === "active" && (
                            <p className="text-xs text-slate-500 mt-1">
                              Next step: {new Date(e.nextExecutionAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {sequences.length > 0 && (
                    <Select onValueChange={(val) => {
                      enrollInSequence.mutate({ userId: contactUserId, sequenceId: parseInt(val) });
                    }}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Enroll in sequence..." />
                      </SelectTrigger>
                      <SelectContent>
                        {sequences.map(s => (
                          <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </>
              )}
            </AccordionContent>
          </AccordionItem>
          <Separator />

          <AccordionItem value="reminders" className="border-b-0 px-4">
            <AccordionTrigger className="hover:no-underline text-sm font-semibold py-4">
              Reminders {reminders.length > 0 && <Badge variant="outline" className="ml-2 text-[10px]">{reminders.length}</Badge>}
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              {reminders.length === 0 ? (
                <div className="bg-slate-50 border rounded-md p-4 text-center">
                  <Clock className="h-5 w-5 mx-auto mb-2 text-slate-400" />
                  <p className="text-sm text-muted-foreground">No upcoming reminders for this customer.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {reminders.map((r, i) => (
                    <div key={i} className="flex items-start gap-3 bg-amber-50/50 border border-amber-100 rounded-md p-3">
                      <Clock className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-slate-800">{r.label}</p>
                        {r.date && (
                          <p className="text-xs text-slate-500 mt-0.5">
                            {new Date(r.date).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
          <Separator />

          <AccordionItem value="payments" className="border-b-0 px-4">
            <AccordionTrigger className="hover:no-underline text-sm font-semibold py-4">
              Recent payments {payments.length > 0 && <Badge variant="outline" className="ml-2 text-[10px]">{payments.length}</Badge>}
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              {payments.length === 0 ? (
                <div className="bg-slate-50 border rounded-md p-4 text-center">
                  <CreditCard className="h-5 w-5 mx-auto mb-2 text-slate-400" />
                  <p className="text-sm text-muted-foreground">No payment history found.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {payments.map((p, i) => (
                    <div key={i} className="flex items-center justify-between bg-green-50/50 border border-green-100 rounded-md p-3">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{p.label}</p>
                        <p className="text-xs text-slate-500 capitalize">{p.status}</p>
                      </div>
                      <div className="text-right">
                        {p.amount && <p className="text-sm font-bold text-green-700">{p.amount}</p>}
                        <p className="text-[10px] text-slate-400">
                          {new Date(p.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
          <Separator />

          <AccordionItem value="images" className="border-b-0 px-4">
            <AccordionTrigger className="hover:no-underline text-sm font-semibold py-4">
              Images
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-3 gap-2">
                {activeChat?.messages?.filter(m => m.type === "message" && m.mediaUrl).map((msg: any, idx) => (
                  <div 
                    key={idx} 
                    className="aspect-square bg-muted rounded-md overflow-hidden cursor-zoom-in relative group"
                    onClick={() => setFullscreenImage(msg.mediaUrl!.includes('twilio.com') ? `/api/crm/media?url=${encodeURIComponent(msg.mediaUrl!)}` : msg.mediaUrl!)}
                  >
                    <img 
                      src={msg.mediaUrl!.includes('twilio.com') ? `/api/crm/media?url=${encodeURIComponent(msg.mediaUrl!)}` : msg.mediaUrl!} 
                      className="w-full h-full object-cover transition-transform group-hover:scale-110"
                      alt="Attachment"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    {msg.direction === 'inbound' ? (
                      <div className="absolute bottom-1 right-1 bg-black/50 text-white text-[10px] px-1 rounded backdrop-blur-sm">
                        Received
                      </div>
                    ) : (
                      <div className="absolute bottom-1 right-1 bg-primary/80 text-primary-foreground text-[10px] px-1 rounded backdrop-blur-sm">
                        Sent
                      </div>
                    )}
                  </div>
                ))}
                {!activeChat?.messages?.some(m => m.type === "message" && m.mediaUrl) && (
                  <div className="col-span-3 text-center text-sm text-muted-foreground py-4">
                    No images found
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

        </Accordion>
      </div>
    </div>
  );

  return (
    <>
      <div className="w-[300px] border-l hidden xl:block h-full">
        {renderContent()}
      </div>

      {/* Mobile view - Sheet controlled by header button */}
      <div className="xl:hidden">
        <Sheet open={isProfileOpen} onOpenChange={setIsProfileOpen}>
          <SheetContent side="right" className="w-[85vw] sm:w-[400px] p-0 border-l">
            {renderContent()}
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
