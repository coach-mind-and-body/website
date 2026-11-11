"use client";

import { useState, type ReactNode } from "react";
import { Copy, Mail, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import {
  clientIntakeMailtoHref,
  clientIntakeShareMessage,
  clientIntakeShareUrl,
  clientIntakeSmsHref,
} from "@shared/clientIntake";

const shareUrl = clientIntakeShareUrl();

export function ClientIntakeShareBox() {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied");
    } catch {
      toast.error("Select the link and copy it.");
    }
  }

  return (
    <div className="rounded-2xl p-5" style={{ background: "oklch(1 0 0)" }}>
      <p className="text-sm font-semibold" style={{ color: "oklch(0.28 0.015 50)" }}>
        Metabolic Coaching link
      </p>
      <p className="mt-2 break-all text-sm" style={{ color: "oklch(0.42 0.015 50)" }}>
        {shareUrl}
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <ShareButton onClick={() => void copyLink()} icon={<Copy size={16} />}>
          {copied ? "Copied" : "Copy link"}
        </ShareButton>
        <ShareLink href={clientIntakeSmsHref()} icon={<MessageSquare size={16} />}>
          Text the link
        </ShareLink>
        <ShareLink href={clientIntakeMailtoHref()} icon={<Mail size={16} />}>
          Email the link
        </ShareLink>
      </div>
      <p className="mt-3 text-xs" style={{ color: "oklch(0.52 0.015 50)" }}>
        {clientIntakeShareMessage(shareUrl).split("\n")[0]}
      </p>
    </div>
  );
}

const shareClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-bold";
const shareStyle = {
  background: "oklch(0.96 0.025 50)",
  color: "oklch(0.32 0.04 50)",
  border: "1px solid oklch(0.90 0.015 80)",
};

function ShareButton({
  children,
  icon,
  onClick,
}: {
  children: ReactNode;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className={shareClass} style={shareStyle}>
      {icon}
      {children}
    </button>
  );
}

function ShareLink({ href, children, icon }: { href: string; children: ReactNode; icon: ReactNode }) {
  return (
    <a href={href} className={shareClass} style={shareStyle}>
      {icon}
      {children}
    </a>
  );
}
