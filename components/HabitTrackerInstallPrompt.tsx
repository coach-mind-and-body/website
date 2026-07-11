"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";

const DISMISS_KEY = "mbr_pwa_install_dismissed_v1";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    nav.standalone === true
  );
}

/**
 * Install / Add-to-Home-Screen prompt for the habit tracker PWA.
 * - Android/Chrome: native beforeinstallprompt
 * - iOS Safari: step-by-step Add to Home Screen (no install API)
 */
export default function HabitTrackerInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [iosMode, setIosMode] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    try {
      if (localStorage.getItem(DISMISS_KEY) === "1") return;
    } catch {
      /* ignore */
    }

    if (isIos()) {
      setIosMode(true);
      setShow(true);
      return;
    }

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", onBip);
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  const dismiss = useCallback(() => {
    setShow(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  }, []);

  const installAndroid = useCallback(async () => {
    if (!deferred) return;
    setInstalling(true);
    try {
      await deferred.prompt();
      await deferred.userChoice;
      setDeferred(null);
      setShow(false);
    } catch {
      /* user closed */
    } finally {
      setInstalling(false);
    }
  }, [deferred]);

  if (!show || isStandalone()) return null;

  return (
    <div
      className="fixed z-[60] left-3 right-3 sm:left-auto sm:right-4 sm:max-w-sm"
      style={{
        bottom: "max(5.5rem, calc(4.5rem + env(safe-area-inset-bottom)))",
      }}
    >
      <div className="rounded-2xl bg-white border border-[#f0e8e4] shadow-xl p-4 relative">
        <button
          type="button"
          onClick={dismiss}
          className="absolute top-2 right-2 p-1.5 rounded-full text-gray-400 hover:bg-gray-100"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>

        <div className="flex items-start gap-3 pr-6">
          <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 shadow-sm border border-[#f0e8e4]">
            <img src="/logo-circular.png" alt="" className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm text-[#3a5a3a]">Install MBR Habits</p>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
              Add the free tracker to your home screen — opens like an app, works offline for
              saved pages.
            </p>
          </div>
        </div>

        {iosMode ? (
          <div className="mt-3 rounded-xl bg-[#faf5f5] px-3 py-2.5 text-xs text-gray-600 leading-relaxed">
            <p className="font-semibold text-[#3a5a3a] mb-1.5 flex items-center gap-1.5">
              <Share size={14} className="text-[#c9a96e]" />
              On iPhone (Safari)
            </p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>
                Tap the <strong>Share</strong> button
              </li>
              <li>
                Scroll and tap <strong>Add to Home Screen</strong>
              </li>
              <li>
                Tap <strong>Add</strong>
              </li>
            </ol>
            <p className="mt-2 text-[11px] text-gray-400">
              Use Safari for install. Chrome on iOS cannot add PWAs the same way.
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={installAndroid}
            disabled={!deferred || installing}
            className="mt-3 w-full flex items-center justify-center gap-2 min-h-[44px] rounded-full font-bold text-sm text-white bg-[#c9a96e] hover:bg-[#b09055] disabled:opacity-60"
          >
            <Download size={16} />
            {installing ? "Installing…" : deferred ? "Install app" : "Install available soon"}
          </button>
        )}
      </div>
    </div>
  );
}
