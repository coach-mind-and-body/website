"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { PROGRAM_LIST, type ProgramId } from "@shared/programs";

export type EnrollModalSeed = {
  name?: string;
  email: string;
  phone?: string | null;
  programs?: ProgramId[];
  applicationId?: number;
};

type AdminManualEnrollModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  seed?: EnrollModalSeed | null;
  /** Programs to check when opening a blank enroll window. */
  presetPrograms?: ProgramId[] | null;
};

const fieldStyle = {
  background: "oklch(1 0 0)",
  borderColor: "oklch(0.90 0.015 80)",
  color: "oklch(0.20 0.015 50)",
};

export function AdminManualEnrollModal({
  open,
  onOpenChange,
  seed = null,
  presetPrograms = null,
}: AdminManualEnrollModalProps) {
  const utils = trpc.useUtils();
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<{ id: number; name: string | null; email: string } | null>(null);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [locked, setLocked] = useState<EnrollModalSeed | null>(null);
  const [programs, setPrograms] = useState<ProgramId[]>([]);
  const [applicationId, setApplicationId] = useState<number | undefined>(undefined);
  const [enrollPaymentType, setEnrollPaymentType] = useState<"full" | "deposit">("deposit");
  const [enrollPaymentStatus, setEnrollPaymentStatus] = useState<"paid" | "unpaid">("paid");
  const [challengeId, setChallengeId] = useState<number | "">("");

  const trimmedSearch = search.trim();
  const { data: matches, isFetching } = trpc.enrollment.adminSearchClients.useQuery(
    { query: trimmedSearch },
    { enabled: open && mode === "existing" && trimmedSearch.length >= 2 }
  );
  const { data: challenges } = trpc.challenges.adminListChallenges.useQuery(undefined, {
    enabled: open && programs.includes("challenge"),
  });

  const reset = () => {
    setSearch("");
    setSelected(null);
    setNewName("");
    setNewEmail("");
    setLocked(null);
    setPrograms([]);
    setApplicationId(undefined);
    setEnrollPaymentType("deposit");
    setEnrollPaymentStatus("paid");
    setChallengeId("");
    setMode("existing");
  };

  useEffect(() => {
    if (!open) return;
    if (!seed) {
      setLocked(null);
      setApplicationId(undefined);
      if (presetPrograms?.length) setPrograms([...presetPrograms]);
      return;
    }
    setLocked(seed);
    setMode("new");
    setNewName(seed.name ?? "");
    setNewEmail(seed.email);
    setPrograms(seed.programs ? [...seed.programs] : []);
    setApplicationId(seed.applicationId);
  }, [open, seed, presetPrograms]);

  const adminCreateEnrollment = trpc.enrollment.adminCreate.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      utils.leads.unifiedContacts.invalidate();
      utils.leads.list.invalidate();
      utils.enrollment.adminListAllUsers.invalidate();
      utils.enrollment.adminListHolidayApplications.invalidate();
      utils.enrollment.adminProgramRoster.invalidate();
      onOpenChange(false);
      reset();
    },
    onError: (e) => toast.error(e.message),
  });

  const email = locked ? locked.email : mode === "existing" ? selected?.email ?? "" : newEmail.trim();
  const name = locked ? locked.name || newName : mode === "existing" ? selected?.name ?? "" : newName.trim();
  const phone = locked?.phone ?? undefined;

  const toggleProgram = (id: ProgramId) => {
    setPrograms((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const handleCreate = () => {
    if (!locked && mode === "new" && name.trim().length < 2) {
      toast.error("Please enter their name");
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error(mode === "existing" && !locked ? "Choose a person, or enter someone new" : "Please enter a valid email address");
      return;
    }
    if (programs.length === 0) {
      toast.error("Pick at least one program");
      return;
    }
    adminCreateEnrollment.mutate({
      clientEmail: email,
      clientName: name.trim() || undefined,
      phone: phone || undefined,
      programs,
      paymentType: enrollPaymentType,
      depositPaid: enrollPaymentStatus === "paid",
      balancePaid: enrollPaymentStatus === "paid" && enrollPaymentType === "full",
      challengeId: programs.includes("challenge") && challengeId !== "" ? challengeId : undefined,
      applicationId,
    });
  };

  const choiceStyle = (active: boolean) => ({
    background: active ? "oklch(0.72 0.12 75)" : "transparent",
    borderColor: "oklch(0.72 0.12 75)",
    color: active ? "oklch(0.96 0.025 50)" : "oklch(0.72 0.12 75)",
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent
        aria-describedby={undefined}
        className="max-w-lg max-h-[85vh] overflow-y-auto"
        style={{ background: "oklch(0.96 0.025 50)", border: "1px solid oklch(0.90 0.015 80)" }}
      >
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.20 0.015 50)", fontSize: "1.6rem" }}>
            Enroll someone
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm" style={{ color: "oklch(0.42 0.015 50)" }}>
            Pick the person and every program they should join. A new person gets one email to set a password, or they
            can use Continue with Google if that is their inbox. Each program that already has an email series starts
            on its own.
          </p>

          {locked ? (
            <div className="rounded-lg px-3 py-2" style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0.90 0.015 80)" }}>
              <p className="text-sm font-semibold" style={{ color: "oklch(0.20 0.015 50)" }}>
                {locked.name || locked.email}
              </p>
              <p className="text-xs" style={{ color: "oklch(0.52 0.015 50)" }}>
                {locked.email}
                {locked.phone ? ` · ${locked.phone}` : ""}
              </p>
            </div>
          ) : (
          <>
          <div className="flex gap-3">
            <button type="button" onClick={() => setMode("existing")} className="flex-1 py-2 rounded-lg text-sm font-semibold border" style={choiceStyle(mode === "existing")}>
              Someone already here
            </button>
            <button type="button" onClick={() => setMode("new")} className="flex-1 py-2 rounded-lg text-sm font-semibold border" style={choiceStyle(mode === "new")}>
              Someone new
            </button>
          </div>

          {mode === "existing" ? (
            <div>
              <Label style={{ color: "oklch(0.42 0.015 50)" }}>Search by name or email</Label>
              <Input
                type="search"
                placeholder="Start typing a name or email"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSelected(null);
                }}
                className="mt-1"
                style={fieldStyle}
              />
              {selected && (
                <p className="text-sm mt-2" style={{ color: "oklch(0.20 0.015 50)" }}>
                  Enrolling <strong>{selected.name || selected.email}</strong>
                  {selected.name ? ` · ${selected.email}` : ""}
                </p>
              )}
              {trimmedSearch.length >= 2 && !selected && (
                <div className="mt-2 rounded-lg overflow-hidden" style={{ border: "1px solid oklch(0.90 0.015 80)" }}>
                  {isFetching && (
                    <p className="text-xs px-3 py-2" style={{ color: "oklch(0.52 0.015 50)" }}>
                      Looking…
                    </p>
                  )}
                  {!isFetching && (matches ?? []).length === 0 && (
                    <p className="text-xs px-3 py-2" style={{ color: "oklch(0.52 0.015 50)" }}>
                      No one matches. Switch to someone new and enter their name and email.
                    </p>
                  )}
                  {(matches ?? []).map((person) => (
                    <button
                      key={person.id}
                      type="button"
                      onClick={() => person.email && setSelected({ id: person.id, name: person.name, email: person.email })}
                      className="block w-full text-left px-3 py-2 text-sm hover:opacity-80"
                      style={{ background: "oklch(1 0 0)", color: "oklch(0.20 0.015 50)" }}
                    >
                      <span className="font-semibold">{person.name || "No name yet"}</span>
                      <span className="block text-xs" style={{ color: "oklch(0.52 0.015 50)" }}>
                        {person.email}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <Label style={{ color: "oklch(0.42 0.015 50)" }}>Name</Label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Their name" className="mt-1" style={fieldStyle} />
              </div>
              <div>
                <Label style={{ color: "oklch(0.42 0.015 50)" }}>Email</Label>
                <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="name@email.com" className="mt-1" style={fieldStyle} />
              </div>
            </div>
          )}
          </>
          )}

          <div>
            <Label style={{ color: "oklch(0.42 0.015 50)" }}>Programs</Label>
            <div className="mt-2 space-y-2">
              {PROGRAM_LIST.map((item) => {
                const checked = programs.includes(item.id);
                return (
                  <label
                    key={item.id}
                    className="flex items-start gap-3 rounded-lg px-3 py-2 cursor-pointer"
                    style={{
                      background: checked ? "oklch(0.93 0.06 75)" : "oklch(1 0 0)",
                      border: "1px solid oklch(0.90 0.015 80)",
                    }}
                  >
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={checked}
                      onChange={() => toggleProgram(item.id)}
                    />
                    <span>
                      <span className="block text-sm font-semibold" style={{ color: "oklch(0.20 0.015 50)" }}>
                        {item.label}
                      </span>
                      <span className="block text-xs" style={{ color: "oklch(0.52 0.015 50)" }}>
                        {item.blurb}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {programs.includes("challenge") && (
            <div>
              <Label style={{ color: "oklch(0.42 0.015 50)" }}>Which challenge</Label>
              <select
                value={challengeId}
                onChange={(e) => setChallengeId(e.target.value ? Number(e.target.value) : "")}
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                style={fieldStyle}
              >
                <option value="">Just the program, no specific challenge</option>
                {(challenges ?? []).map((challenge) => (
                  <option key={challenge.id} value={challenge.id}>
                    {challenge.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {programs.includes("reclaim") && (
            <>
              <div>
                <Label style={{ color: "oklch(0.42 0.015 50)" }}>Payment plan</Label>
                <div className="flex gap-3 mt-1">
                  <button type="button" onClick={() => setEnrollPaymentType("deposit")} className="flex-1 py-2 rounded-lg text-sm font-semibold border" style={choiceStyle(enrollPaymentType === "deposit")}>
                    Deposit ($200)
                  </button>
                  <button type="button" onClick={() => setEnrollPaymentType("full")} className="flex-1 py-2 rounded-lg text-sm font-semibold border" style={choiceStyle(enrollPaymentType === "full")}>
                    Full payment ($597)
                  </button>
                </div>
              </div>
              <div>
                <Label style={{ color: "oklch(0.42 0.015 50)" }}>Payment status</Label>
                <div className="flex gap-3 mt-1">
                  <button type="button" onClick={() => setEnrollPaymentStatus("paid")} className="flex-1 py-2 rounded-lg text-sm font-semibold border" style={choiceStyle(enrollPaymentStatus === "paid")}>
                    Paid outside Stripe
                  </button>
                  <button type="button" onClick={() => setEnrollPaymentStatus("unpaid")} className="flex-1 py-2 rounded-lg text-sm font-semibold border" style={choiceStyle(enrollPaymentStatus === "unpaid")}>
                    Collect later
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} style={{ borderColor: "oklch(0.90 0.015 80)", color: "oklch(0.42 0.015 50)" }}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={adminCreateEnrollment.isPending || !email || programs.length === 0}
            style={{ background: "oklch(0.72 0.12 75)", color: "oklch(1 0 0)" }}
          >
            {adminCreateEnrollment.isPending ? "Enrolling…" : "Enroll"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
