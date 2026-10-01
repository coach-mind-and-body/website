"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { BRAND } from "@shared/brand";

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
 * Install helper.
 * iPhone: App Store. Android: browser install when Chrome allows it.
 */
export default function HabitTrackerInstallPrompt({
  variant = "button",
}: {
  variant?: "button" | "auto";
}) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [open, setOpen] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [ios, setIos] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [showAutoAndroid, setShowAutoAndroid] = useState(false);
  const [showIosStore, setShowIosStore] = useState(false);

  useEffect(() => {
    setIos(isIos());
    setStandalone(isStandalone());

    if (variant === "auto" && isIos() && !isStandalone()) {
      try {
        if (!localStorage.getItem("mbr_appstore_prompt_dismissed")) {
          setShowIosStore(true);
        }
      } catch {
        setShowIosStore(true);
      }
    }

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      if (variant === "auto" && !isIos() && !isStandalone()) {
        setShowAutoAndroid(true);
      }
    };
    window.addEventListener("beforeinstallprompt", onBip);
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, [variant]);

  const installAndroid = useCallback(async () => {
    if (!deferred) return;
    setInstalling(true);
    try {
      await deferred.prompt();
      await deferred.userChoice;
      setDeferred(null);
      setOpen(false);
      setShowAutoAndroid(false);
    } catch {
      /* closed */
    } finally {
      setInstalling(false);
    }
  }, [deferred]);

  if (standalone) {
    return null;
  }

  const appStoreButton = (
    <a
      href={BRAND.appStoreUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="w-full flex items-center justify-center gap-2 min-h-[48px] rounded-full font-bold text-sm text-white bg-[#c9a96e] hover:bg-[#b09055]"
    >
      <Download size={18} />
      Get the iPhone app — free
    </a>
  );

  const guide = (
    <div className="space-y-4">
      {ios ? (
        <>
          <p className="text-sm text-gray-600 leading-relaxed">
            The real iPhone app is live on the App Store — habits, food log, recipes, and this week’s
            challenge on your home screen.
          </p>
          {appStoreButton}
          <p className="text-xs text-gray-400 leading-relaxed">
            Already using this in the browser? You can keep it, or install the app and sign in with the
            same email.
          </p>
        </>
      ) : deferred ? (
        <>
          <p className="text-sm text-gray-600 leading-relaxed">
            Your browser can install this as an app icon in one tap.
          </p>
          <button
            type="button"
            onClick={installAndroid}
            disabled={installing}
            className="w-full flex items-center justify-center gap-2 min-h-[48px] rounded-full font-bold text-sm text-white bg-[#c9a96e] hover:bg-[#b09055] disabled:opacity-60"
          >
            <Download size={18} />
            {installing ? "Opening install…" : "Install app icon"}
          </button>
        </>
      ) : (
        <>
          <p className="text-sm text-gray-600 leading-relaxed">
            {ios
              ? "On iPhone, Apple doesn’t allow a one-tap install button. Use Safari and these 3 steps:"
              : "If you don’t see an install button, open this page in Chrome on Android — or on iPhone use Safari:"}
          </p>
          <ol className="space-y-3">
            <li className="flex gap-3 items-start">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#3a5a3a] text-white text-sm font-bold">
                1
              </span>
              <span className="text-sm text-gray-700 pt-1">
                Tap <strong>Share</strong>{" "}
                <Share className="inline h-4 w-4 text-[#c9a96e] align-text-bottom" /> at the
                bottom of Safari
              </span>
            </li>
            <li className="flex gap-3 items-start">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#3a5a3a] text-white text-sm font-bold">
                2
              </span>
              <span className="text-sm text-gray-700 pt-1">
                Tap <strong>Add to Home Screen</strong>
                <span className="block text-xs text-gray-500 mt-0.5">
                  (you may need to swipe the row of icons — not a long page scroll)
                </span>
              </span>
            </li>
            <li className="flex gap-3 items-start">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#3a5a3a] text-white text-sm font-bold">
                3
              </span>
              <span className="text-sm text-gray-700 pt-1">
                Tap <strong>Add</strong> — done. Open it like any app.
              </span>
            </li>
          </ol>
          <p className="text-xs text-gray-400 leading-relaxed">
            Must use <strong>Safari</strong> on iPhone. Chrome on iPhone cannot add home-screen
            web apps the same way. You can use the tracker in the browser with no install.
          </p>
        </>
      )}
    </div>
  );

  const dismissIosStore = () => {
    setShowIosStore(false);
    try {
      localStorage.setItem("mbr_appstore_prompt_dismissed", "1");
    } catch {
      /* ignore */
    }
  };

  return (
    <>
      {variant === "button" && (
        <a
          href={BRAND.appStoreUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 min-h-[44px] rounded-full font-bold text-sm text-white bg-[#c9a96e] hover:bg-[#b09055]"
        >
          <Download size={16} />
          Get the iPhone app — free
        </a>
      )}

      {variant === "auto" && showIosStore && (
        <div
          className="fixed z-[60] left-3 right-3 sm:left-auto sm:right-4 sm:max-w-sm"
          style={{
            bottom: "max(5.5rem, calc(4.5rem + env(safe-area-inset-bottom)))",
          }}
        >
          <div className="rounded-2xl bg-white border border-[#f0e8e4] shadow-xl p-4 relative">
            <button
              type="button"
              onClick={dismissIosStore}
              className="absolute top-2 right-2 p-1.5 rounded-full text-gray-400 hover:bg-gray-100"
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
            <p className="font-bold text-sm text-[#3a5a3a] pr-6">The iPhone app is live</p>
            <p className="text-xs text-gray-500 mt-1 mb-3">Free on the App Store — same tracker, on your home screen.</p>
            <a
              href={BRAND.appStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 min-h-[44px] rounded-full font-bold text-sm text-white bg-[#c9a96e]"
            >
              <Download size={16} />
              Get the app
            </a>
          </div>
        </div>
      )}

      {variant === "auto" && showAutoAndroid && deferred && (
        <div
          className="fixed z-[60] left-3 right-3 sm:left-auto sm:right-4 sm:max-w-sm"
          style={{
            bottom: "max(5.5rem, calc(4.5rem + env(safe-area-inset-bottom)))",
          }}
        >
          <div className="rounded-2xl bg-white border border-[#f0e8e4] shadow-xl p-4 relative">
            <button
              type="button"
              onClick={() => setShowAutoAndroid(false)}
              className="absolute top-2 right-2 p-1.5 rounded-full text-gray-400 hover:bg-gray-100"
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
            <p className="font-bold text-sm text-[#3a5a3a] pr-6">Add app icon?</p>
            <p className="text-xs text-gray-500 mt-1 mb-3">One tap — opens like an app.</p>
            <button
              type="button"
              onClick={installAndroid}
              disabled={installing}
              className="w-full flex items-center justify-center gap-2 min-h-[44px] rounded-full font-bold text-sm text-white bg-[#c9a96e]"
            >
              <Download size={16} />
              {installing ? "…" : "Install"}
            </button>
          </div>
        </div>
      )}

      {open && (
        <div
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4 bg-black/40"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-install-title"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-5 sm:p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h2
                  id="pwa-install-title"
                  className="font-playfair text-xl font-bold text-[#3a5a3a]"
                >
                  {ios ? "Get the iPhone app" : "Home screen icon"}
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  {ios
                    ? "Free on the App Store. The tracker still works in the browser too."
                    : "Optional — the tracker works in the browser too."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-full text-gray-400 hover:bg-gray-100"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            {guide}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-5 w-full min-h-[44px] rounded-full font-semibold text-sm text-[#3a5a3a] border border-gray-200 hover:bg-gray-50"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
