"use client";

import { useState } from "react";

export function ConfirmSubmit({
  action,
  label,
  confirm,
  className,
  confirmClassName,
  hidden,
}: {
  action: (formData: FormData) => Promise<void>;
  label: string;
  confirm: string;
  className?: string;
  confirmClassName?: string;
  hidden?: Record<string, string>;
}) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {label}
      </button>
    );
  }
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      {hidden
        ? Object.entries(hidden).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))
        : null}
      <span className="text-sm text-stone-600">{confirm}</span>
      <button type="submit" className={confirmClassName ?? className}>
        Yes
      </button>
      <button type="button" className="text-sm underline" onClick={() => setOpen(false)}>
        Cancel
      </button>
    </form>
  );
}
