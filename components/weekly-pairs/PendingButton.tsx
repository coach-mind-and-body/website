"use client";

import { useFormStatus } from "react-dom";

export function PendingButton({
  label,
  pendingLabel,
  className,
}: {
  label: string;
  pendingLabel: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      className={className}
      type="submit"
      disabled={pending}
      aria-busy={pending}
      style={pending ? { opacity: 0.65, cursor: "progress" } : undefined}
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
