"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type AdminManualEnrollModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AdminManualEnrollModal({ open, onOpenChange }: AdminManualEnrollModalProps) {
  const [enrollEmail, setEnrollEmail] = useState("");
  const [enrollPaymentType, setEnrollPaymentType] = useState<"full" | "deposit">("deposit");
  const [enrollPaymentStatus, setEnrollPaymentStatus] = useState<"paid" | "unpaid">("paid");

  const adminCreateEnrollment = trpc.enrollment.adminCreate.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      onOpenChange(false);
      setEnrollEmail("");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleCreate = () => {
    const email = enrollEmail.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    adminCreateEnrollment.mutate({
      clientEmail: email,
      paymentType: enrollPaymentType,
      depositPaid: enrollPaymentStatus === "paid",
      balancePaid: enrollPaymentStatus === "paid" && enrollPaymentType === "full",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} style={{ background: "oklch(0.96 0.025 50)", border: "1px solid oklch(0.90 0.015 80)" }}>
        <DialogHeader>
          <DialogTitle style={{ color: "oklch(0.20 0.015 50)" }}>Manually Enroll a Client</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm" style={{ color: "oklch(0.42 0.015 50)" }}>
            Enter their email to create an enrollment and 6 coaching sessions. If they don't have an account yet, one
            will be created automatically and they'll receive a welcome email to set their password.
          </p>
          <div>
            <Label style={{ color: "oklch(0.42 0.015 50)" }}>Client Email</Label>
            <Input
              type="email"
              placeholder="client@email.com"
              value={enrollEmail}
              onChange={(e) => setEnrollEmail(e.target.value)}
              className="mt-1"
              style={{ background: "oklch(1 0 0)", borderColor: "oklch(0.90 0.015 80)", color: "oklch(0.20 0.015 50)" }}
            />
          </div>
          <div>
            <Label style={{ color: "oklch(0.42 0.015 50)" }}>Payment Plan</Label>
            <div className="flex gap-3 mt-1">
              <button
                onClick={() => setEnrollPaymentType("deposit")}
                className="flex-1 py-2 rounded-lg text-sm font-semibold border transition-all"
                style={{
                  background: enrollPaymentType === "deposit" ? "oklch(0.72 0.12 75)" : "transparent",
                  borderColor: "oklch(0.72 0.12 75)",
                  color: enrollPaymentType === "deposit" ? "oklch(0.96 0.025 50)" : "oklch(0.72 0.12 75)",
                }}
              >
                Deposit ($200)
              </button>
              <button
                onClick={() => setEnrollPaymentType("full")}
                className="flex-1 py-2 rounded-lg text-sm font-semibold border transition-all"
                style={{
                  background: enrollPaymentType === "full" ? "oklch(0.72 0.12 75)" : "transparent",
                  borderColor: "oklch(0.72 0.12 75)",
                  color: enrollPaymentType === "full" ? "oklch(0.96 0.025 50)" : "oklch(0.72 0.12 75)",
                }}
              >
                Full Payment ($597)
              </button>
            </div>
          </div>
          <div>
            <Label style={{ color: "oklch(0.42 0.015 50)" }}>Payment Status</Label>
            <div className="flex gap-3 mt-1">
              <button
                onClick={() => setEnrollPaymentStatus("paid")}
                className="flex-1 py-2 rounded-lg text-sm font-semibold border transition-all"
                style={{
                  background: enrollPaymentStatus === "paid" ? "oklch(0.72 0.12 75)" : "transparent",
                  borderColor: "oklch(0.72 0.12 75)",
                  color: enrollPaymentStatus === "paid" ? "oklch(0.96 0.025 50)" : "oklch(0.72 0.12 75)",
                }}
              >
                Paid (Outside Stripe)
              </button>
              <button
                onClick={() => setEnrollPaymentStatus("unpaid")}
                className="flex-1 py-2 rounded-lg text-sm font-semibold border transition-all"
                style={{
                  background: enrollPaymentStatus === "unpaid" ? "oklch(0.72 0.12 75)" : "transparent",
                  borderColor: "oklch(0.72 0.12 75)",
                  color: enrollPaymentStatus === "unpaid" ? "oklch(0.96 0.025 50)" : "oklch(0.72 0.12 75)",
                }}
              >
                Unpaid (Collect Later)
              </button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            style={{ borderColor: "oklch(0.90 0.015 80)", color: "oklch(0.42 0.015 50)" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!enrollEmail.trim() || adminCreateEnrollment.isPending}
            style={{ background: "oklch(0.72 0.12 75)", color: "oklch(1 0 0)" }}
          >
            {adminCreateEnrollment.isPending ? "Creating..." : "Create Enrollment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}