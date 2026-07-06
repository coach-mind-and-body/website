"use client";

import React, { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, User, X } from "lucide-react";
import type { ComposeContactHit } from "@/lib/composeRecipient";

type Props = {
  value: string;
  selected: ComposeContactHit | null;
  onValueChange: (value: string) => void;
  onSelect: (contact: ComposeContactHit | null) => void;
};

function designationBadgeClass(designation?: string): string {
  switch (designation) {
    case "reclaim":
      return "bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200";
    case "fpu":
      return "bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200";
    case "admin":
      return "bg-purple-100 text-purple-800 hover:bg-purple-100 border-purple-200";
    case "discovery":
      return "bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200";
    default:
      return "";
  }
}

function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, "").replace(/^1/, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

export default function ContactRecipientPicker({
  value,
  selected,
  onValueChange,
  onSelect,
}: Props) {
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(value.trim()), 200);
    return () => clearTimeout(timer);
  }, [value]);

  const { data: results = [], isFetching } = trpc.messaging.searchContactsForCompose.useQuery(
    { query: debouncedQuery },
    { enabled: debouncedQuery.length >= 2 && !selected }
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (contact: ComposeContactHit) => {
    onSelect(contact);
    onValueChange(contact.name);
    setIsOpen(false);
  };

  const clearSelection = () => {
    onSelect(null);
    onValueChange("");
  };

  return (
    <div ref={containerRef} className="relative">
      <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">
        To (name or number)
      </label>

      {selected ? (
        <div className="flex items-center gap-2 h-10 px-3 border rounded-md bg-slate-50">
          <User className="h-4 w-4 text-slate-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{selected.name}</p>
            {selected.phone && (
              <p className="text-xs text-slate-500 truncate">
                {formatPhoneDisplay(selected.phone)}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={clearSelection}
            className="p-1 text-slate-400 hover:text-slate-600 rounded"
            aria-label="Clear recipient"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            autoFocus
            placeholder="Search by name, email, or phone..."
            value={value}
            onChange={e => {
              onValueChange(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            className="h-10 pl-9"
          />
          {isFetching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-slate-400" />
          )}
        </div>
      )}

      {isOpen && !selected && debouncedQuery.length >= 2 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border bg-white shadow-lg max-h-56 overflow-y-auto">
          {results.length === 0 && !isFetching ? (
            <div className="px-3 py-4 text-sm text-slate-500 text-center">
              No contacts found. Type a full phone number to text someone new.
            </div>
          ) : (
            results.map(contact => (
              <button
                key={contact.id}
                type="button"
                className="w-full text-left px-3 py-2.5 hover:bg-slate-50 border-b last:border-b-0 transition-colors"
                onClick={() => handleSelect(contact)}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-slate-900 truncate">
                    {contact.name}
                  </span>
                  <Badge
                    variant="secondary"
                    className={`text-[10px] shrink-0 ${designationBadgeClass(contact.designation)}`}
                  >
                    {contact.source}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 truncate">
                  {contact.phone
                    ? formatPhoneDisplay(contact.phone)
                    : contact.email || "No phone on file"}
                </p>
              </button>
            ))
          )}
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-1.5">
        Search customers, leads, or past chats — or type a phone number directly.
      </p>
    </div>
  );
}