"use client";

import { BRAND } from "@shared/brand";

export function GetAppStoreButton({
  label = "Get the iPhone app — free",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <a
      href={BRAND.appStoreUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={
        className ??
        "inline-flex w-full min-h-[52px] items-center justify-center px-6 text-center text-base font-bold rounded-full text-white"
      }
      style={className ? undefined : { background: "#c9a96e" }}
    >
      {label}
    </a>
  );
}
