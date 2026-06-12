import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { getDeviceId } from "@/lib/deviceId";

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function useWebPush() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [permission, setPermission] = useState(Notification.permission);
  
  const subscribeMutation = trpc.push.subscribe.useMutation();

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      
      navigator.serviceWorker.ready.then(reg => {
        reg.pushManager.getSubscription().then(sub => {
          if (sub) setIsSubscribed(true);
        });
      });
    }
  }, []);

  const subscribeToPush = async () => {
    if (!isSupported) {
      toast.error("Push notifications are not supported in this browser.");
      return;
    }
    
    setIsSubscribing(true);

    try {
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();

      if (!sub) {
        // Replace with the public key generated earlier
        const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
        if (!publicVapidKey) {
          throw new Error("Missing VAPID public key");
        }
        
        const permissionResult = await Notification.requestPermission();
        setPermission(permissionResult);
        if (permissionResult !== 'granted') {
          throw new Error('Notification permission denied');
        }

        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
        });
      }

      // Send to server
      const p256dh = sub.getKey('p256dh') ? btoa(String.fromCharCode.apply(null, new Uint8Array(sub.getKey('p256dh')!) as any)) : "";
      const auth = sub.getKey('auth') ? btoa(String.fromCharCode.apply(null, new Uint8Array(sub.getKey('auth')!) as any)) : "";
      
      await subscribeMutation.mutateAsync({
        endpoint: sub.endpoint,
        p256dh,
        auth,
        deviceId: getDeviceId()
      });

      setIsSubscribed(true);
      toast.success("Notifications enabled! \uD83D\uDD25");
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to enable notifications");
    } finally {
      setIsSubscribing(false);
    }
  };

  return { isSupported, isSubscribed, isSubscribing, permission, subscribeToPush };
}
