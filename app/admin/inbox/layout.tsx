"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Loader2, Bell, X } from "lucide-react";

import { InboxProvider } from "./InboxContext";
import InboxSidebar from "./components/InboxSidebar";
import InboxModals from "./components/InboxModals";
import InboxDeepLinkHandler from "./components/InboxDeepLinkHandler";
import { MobileNav } from "./components/MobileNav";
import { useInboxNewMessageAlerts } from "@/hooks/useInboxNewMessageAlerts";

function InboxNewMessageAlerts() {
  useInboxNewMessageAlerts();
  return null;
}

export default function V2InboxLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  // Push Notifications Logic
  const [notifStatus, setNotifStatus] = useState<"idle" | "subscribed" | "denied" | "loading">("idle");
  const pushPublicKey = trpc.push.getPublicKey.useQuery(undefined, { enabled: !!user && user.role === "admin" });
  const subscribeMutation = trpc.push.subscribe.useMutation();

  const [pushBannerDismissed, setPushBannerDismissed] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") setNotifStatus("subscribed");
      else if (Notification.permission === "denied") setNotifStatus("denied");
      if (localStorage.getItem("utp_push_banner_dismissed") === "1") {
        setPushBannerDismissed(true);
      }
    }
  }, []);

  useEffect(() => {
    const link = document.querySelector('link[rel="manifest"][data-admin]');
    if (!link) {
      const el = document.createElement("link");
      el.rel = "manifest";
      el.href = "/manifest-admin.json";
      el.setAttribute("data-admin", "true");
      document.head.appendChild(el);
    }
    const theme = document.querySelector('meta[name="theme-color"][data-admin]');
    if (!theme) {
      const el = document.createElement("meta");
      el.name = "theme-color";
      el.content = "#B06410";
      el.setAttribute("data-admin", "true");
      document.head.appendChild(el);
    }
  }, []);

  const enableNotifications = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      toast.error("Push notifications not supported in this browser.");
      return;
    }
    try {
      setNotifStatus("loading");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setNotifStatus("denied");
        toast.error("Notification permission denied.");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const publicKey = pushPublicKey.data?.publicKey;
      if (!publicKey) throw new Error("VAPID key not available");

      const urlBase64ToUint8Array = (base64String: string) => {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
      };

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const subJson = sub.toJSON() as any;
      await subscribeMutation.mutateAsync({
        endpoint: subJson.endpoint,
        p256dh: subJson.keys.p256dh,
        auth: subJson.keys.auth,
      });

      setNotifStatus("subscribed");
      toast.success("Push notifications enabled! 🔔");
    } catch (err: any) {
      console.error(err);
      setNotifStatus("idle");
      toast.error(`Failed to enable notifications: ${err.message}`);
    }
  };

  if (user?.role !== "admin") {
    if (loading) {
      return (
        <div className="pt-12 lg:pt-28 flex-1 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      );
    }
    return (
      <div className="pt-12 lg:pt-28 flex-1 flex flex-col items-center justify-center">
        <section className="py-12 bg-background w-full">
          <div className="container max-w-lg text-center mx-auto">
            <h1 className="text-2xl font-bold text-foreground mb-4">Access Denied</h1>
            <p className="text-muted-foreground mb-6">You need admin privileges to access this page.</p>
            <Button variant="outline" asChild>
              <Link href="/">Go Home</Link>
            </Button>
          </div>
        </section>
      </div>
    );
  }

  const dismissPushBanner = () => {
    setPushBannerDismissed(true);
    localStorage.setItem("utp_push_banner_dismissed", "1");
  };

  const showPushBanner = notifStatus !== "subscribed" && notifStatus !== "denied" && !pushBannerDismissed;

  return (
    <InboxProvider>
      <Suspense fallback={null}>
        <InboxDeepLinkHandler />
      </Suspense>
      <InboxNewMessageAlerts />
      <div className="flex flex-col h-[100dvh] w-full bg-background overflow-hidden relative">
        {showPushBanner && (
          <div className="shrink-0 bg-brand-blue text-white px-4 py-2.5 flex items-center gap-3 text-sm z-20">
            <Bell className="w-4 h-4 shrink-0" />
            <p className="flex-1">
              Enable push notifications to get instant SMS alerts on your phone.
            </p>
            <Button
              size="sm"
              variant="secondary"
              className="h-7 text-xs shrink-0"
              onClick={enableNotifications}
              disabled={notifStatus === "loading"}
            >
              {notifStatus === "loading" ? <Loader2 className="w-3 h-3 animate-spin" /> : "Enable"}
            </Button>
            <button type="button" onClick={dismissPushBanner} className="p-1 hover:bg-white/10 rounded" aria-label="Dismiss">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="flex flex-1 overflow-hidden">
          <InboxSidebar />
          {children}
          <InboxModals />
        </div>
        <MobileNav />
      </div>
    </InboxProvider>
  );
}
