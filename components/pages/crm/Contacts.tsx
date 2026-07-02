// @ts-nocheck
"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Tag, Mail, Phone, Workflow, Plus, Loader2, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface ContactTag {
  id: number;
  name: string;
  color: string;
}

interface Contact {
  id: string;
  dbId: number;
  name: string;
  email: string | null;
  phone: string | null;
  type: string;
  tags: ContactTag[];
}

export default function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const createPipelineLead = trpc.quotes.adminCreate.useMutation({
    onSuccess: () => {
      utils.quotes.list.invalidate();
      setAddingId(null);
    },
    onError: (err) => {
      toast.error(`Failed to add lead: ${err.message}`);
      setAddingId(null);
    }
  });

  const fetchContacts = async () => {
    try {
      const res = await fetch("/api/crm/contacts");
      const json = await res.json();
      if (Array.isArray(json)) {
        setContacts(json);
      } else {
        console.error("Failed to load contacts:", json);
        setContacts([]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const allTags = useMemo(() => {
    const tagMap = new Map<number, ContactTag>();
    contacts.forEach(c => c.tags.forEach(t => tagMap.set(t.id, t)));
    return Array.from(tagMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [contacts]);

  const filteredContacts = contacts.filter(c => {
    if (tagFilter && !c.tags.some(t => t.name === tagFilter)) return false;
    const s = search.toLowerCase();
    return (
      (c.name && c.name.toLowerCase().includes(s)) ||
      (c.email && c.email.toLowerCase().includes(s)) ||
      (c.phone && c.phone.includes(s))
    );
  });

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-transparent">
      <div className="p-6 border-b bg-white rounded-t-xl">
        <h1 className="text-2xl font-bold tracking-tight">Contacts Directory</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage all clients, leads, and quoted customers.</p>
          
          <div className="mt-6 flex items-center gap-4 max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search by name, email, or phone..." 
                className="pl-9"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={tagFilter ? "border-brand-blue text-brand-blue" : ""}>
                  <Tag className="w-4 h-4 mr-2" />
                  {tagFilter ? tagFilter : "Filter Tags"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" align="end">
                {allTags.length === 0 ? (
                  <p className="text-xs text-muted-foreground p-2">No tags found on contacts.</p>
                ) : (
                  <div className="space-y-1">
                    {allTags.map(tag => (
                      <button
                        key={tag.id}
                        className={`w-full text-left px-2 py-1.5 rounded text-sm hover:bg-muted ${tagFilter === tag.name ? "bg-muted font-medium" : ""}`}
                        onClick={() => setTagFilter(tagFilter === tag.name ? null : tag.name)}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                )}
                {tagFilter && (
                  <Button variant="ghost" size="sm" className="w-full mt-2 text-xs" onClick={() => setTagFilter(null)}>
                    <X className="w-3 h-3 mr-1" /> Clear filter
                  </Button>
                )}
              </PopoverContent>
            </Popover>
            {tagFilter && (
              <Badge variant="secondary" className="hidden sm:flex gap-1">
                {tagFilter}
                <button onClick={() => setTagFilter(null)} aria-label="Clear tag filter"><X className="w-3 h-3" /></button>
              </Badge>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <p>Loading contacts...</p>
          ) : (
            <div className="border rounded-xl bg-card overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground border-b">
                  <tr>
                    <th className="px-6 py-4 font-medium">Name</th>
                    <th className="px-6 py-4 font-medium">Contact Info</th>
                    <th className="px-6 py-4 font-medium">Type</th>
                    <th className="px-6 py-4 font-medium">Tags</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredContacts.map(contact => (
                    <tr key={contact.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-medium">{contact.name}</td>
                      <td className="px-6 py-4 text-muted-foreground space-y-1">
                        {contact.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5" />
                            {contact.email}
                          </div>
                        )}
                        {contact.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5" />
                            {contact.phone}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {contact.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {contact.tags.map(tag => (
                            <span 
                              key={tag.id} 
                              className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium text-white"
                              style={{ backgroundColor: tag.color }}
                            >
                              {tag.name}
                            </span>
                          ))}
                          {contact.tags.length === 0 && <span className="text-muted-foreground text-xs italic">No tags</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {contact.type !== "Quote" && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            disabled={addingId === contact.id}
                            onClick={() => {
                              setAddingId(contact.id);
                              createPipelineLead.mutate({
                                name: contact.name,
                                phone: contact.phone || undefined,
                                email: contact.email || undefined,
                                notes: "Pushed to pipeline from Contacts directory.",
                              }, {
                                onSuccess: () => {
                                  toast.success(`${contact.name} pushed to Pipeline!`);
                                  fetchContacts(); // refresh contacts to show them as Quote (or just let them exist)
                                }
                              });
                            }}
                          >
                            {addingId === contact.id ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Plus className="w-4 h-4 mr-1.5" />}
                            To Pipeline
                          </Button>
                        )}
                        {contact.type === "Quote" && (
                          <span className="text-xs text-muted-foreground flex items-center justify-end gap-1"><Workflow className="w-3 h-3"/> In Pipeline</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredContacts.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                        No contacts found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
    </div>
  );
}
