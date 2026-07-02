"use client";

import { useEffect, useState } from "react";

/** Poll faster when the tab is focused, slower in background to save battery. */
export function useInboxPollInterval(focusedMs = 3000, backgroundMs = 15000) {
  const [interval, setInterval] = useState(focusedMs);

  useEffect(() => {
    const update = () => setInterval(document.hidden ? backgroundMs : focusedMs);
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, [focusedMs, backgroundMs]);

  return interval;
}