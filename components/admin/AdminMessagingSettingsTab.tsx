// @ts-nocheck
"use client";

import React, { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Plus, Edit2, Trash2, Save, Loader2, MessageSquare, 
  Bell, CheckCircle2, AlertCircle, RefreshCw, Calendar, Link2, Link2Off
} from "lucide-react";

export function AdminMessagingSettingsTab({ 
  gcalStatus, 
  disconnectGcal 
}: { 
  gcalStatus: any; 
  disconnectGcal: () => void;
}) {
  // --- Templates State ---
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editText, setEditText] = useState("");

  const { data: templates = [], isLoading: isTemplatesLoading } = trpc.templates.list.useQuery();
  const utils = trpc.useContext();

  const createMutation = trpc.templates.create.useMutation({
    onSuccess: () => {
      utils.templates.list.invalidate();
      toast.success("Template created!");
      setEditingId(null);
      setEditName("");
      setEditText("");
    }
  });

  const updateMutation = trpc.templates.update.useMutation({
    onSuccess: () => {
      utils.templates.list.invalidate();
      toast.success("Template updated!");
      setEditingId(null);
      setEditName("");
      setEditText("");
    }
  });

  const deleteMutation = trpc.templates.delete.useMutation({
    onSuccess: () => {
      utils.templates.list.invalidate();
      toast.success("Template deleted!");
    }
  });

  const handleSave = () => {
    if (!editName.trim() || !editText.trim()) {
      toast.error("Name and text are required");
      return;
    }
    if (editingId === -1) {
      createMutation.mutate({ name: editName, text: editText });
    } else if (editingId) {
      updateMutation.mutate({ id: editingId, name: editName, text: editText });
    }
  };

  // --- Push Notifications State ---
  const [notifStatus, setNotifStatus] = useState<"idle" | "subscribed" | "denied" | "loading" | "unsupported">("loading");
  const pushPublicKey = trpc.push.getPublicKey.useQuery(undefined);
  const subscribeMutation = trpc.push.subscribe.useMutation();

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setNotifStatus("unsupported");
        return;
      }
      if (Notification.permission === "granted") {
        setNotifStatus("subscribed");
      } else if (Notification.permission === "denied") {
        setNotifStatus("denied");
      } else {
        setNotifStatus("idle");
      }
    }
  }, []);

  const enableNotifications = async () => {
    if (notifStatus === "unsupported") {
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
      if (!publicKey) throw new Error("VAPID public key not loaded yet");

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

  const isPageLoading = isTemplatesLoading;

  if (isPageLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-y-auto">
      <div className="p-6 md:p-10 max-w-4xl mx-auto w-full space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Settings</h1>
          <p className="text-muted-foreground mt-2">Manage message templates, notification preferences, and API integrations.</p>
        </div>

        {/* --- Push Notifications --- */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Push Notifications</h2>
                <p className="text-sm text-slate-500">Receive alerts when clients message you.</p>
              </div>
            </div>
            {notifStatus === "subscribed" ? (
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Enabled</Badge>
            ) : notifStatus === "denied" ? (
              <Badge className="bg-rose-100 text-rose-800 border-rose-200">Blocked</Badge>
            ) : notifStatus === "unsupported" ? (
              <Badge className="bg-slate-100 text-slate-800 border-slate-200">Not Supported</Badge>
            ) : (
              <Button onClick={enableNotifications} disabled={notifStatus === "loading"}>
                {notifStatus === "loading" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Enable Notifications
              </Button>
            )}
          </div>
          <div className="p-6 text-sm text-slate-600">
            {notifStatus === "subscribed" && (
              <p>You are subscribed to receive push notifications on this device. If you're not receiving them, check your device settings to ensure browser notifications are allowed for your PWA.</p>
            )}
            {notifStatus === "denied" && (
              <p className="text-amber-600 font-medium">Notification permission is blocked. To enable them, please reset your browser's site permissions for this app and click Enable again.</p>
            )}
            {notifStatus === "idle" && (
              <p>Click the button above to subscribe this device to instant push notifications when clients send you SMS messages.</p>
            )}
            {notifStatus === "unsupported" && (
              <p>Your browser or operating system does not support native PWA push notifications. (On iOS, you must first add the website to your phone's Home Screen via the Share menu).</p>
            )}
          </div>
        </div>

        {/* --- Calendar Integrations --- */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Google Calendar */}
          <Card className="rounded-xl border border-slate-200 shadow-sm overflow-hidden md:col-span-2">
            <CardHeader className="p-6 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-600" /> Google Calendar
                </CardTitle>
                {gcalStatus?.connected ? (
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200"><CheckCircle2 className="w-3 h-3 mr-1" /> Connected</Badge>
                ) : (
                  <Badge variant="secondary" className="bg-slate-100 text-slate-600"><AlertCircle className="w-3 h-3 mr-1" /> Disconnected</Badge>
                )}
              </div>
              <CardDescription className="text-slate-500 text-sm mt-1">
                Connect your Google Calendar to auto-create sessions with Google Meet links when you schedule client appointments.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {gcalStatus?.connected ? (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600">Your Google Calendar is connected and active as {gcalStatus.email}.</p>
                  <Button variant="outline" size="sm" onClick={disconnectGcal}>
                    <Link2Off className="w-3.5 h-3.5 mr-2" /> Disconnect
                  </Button>
                </div>
              ) : (
                <a href="/api/auth/google-calendar/connect">
                  <Button className="w-full">
                    <Link2 className="w-4 h-4 mr-2" /> Connect Google Calendar
                  </Button>
                </a>
              )}
            </CardContent>
          </Card>
        </div>

        {/* --- Message Templates --- */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Message Templates</h2>
                <p className="text-sm text-slate-500">Quickly send predefined messages to customers.</p>
              </div>
            </div>
            <Button onClick={() => { setEditingId(-1); setEditName(""); setEditText(""); }}>
              <Plus className="w-4 h-4 mr-2" /> New Template
            </Button>
          </div>

          <div className="p-6 space-y-4">
            {editingId === -1 && (
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-4 mb-6">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Template Name</label>
                  <Input value={editName} onChange={e => setEditName(e.target.value)} placeholder="e.g. Disney Quote Intro" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Message Text</label>
                  <Textarea value={editText} onChange={e => setEditText(e.target.value)} placeholder="Hi ((first_name)), here is your quote..." className="min-h-[100px]" />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                  <Button onClick={handleSave} disabled={createMutation.isPending}>
                    {createMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Save
                  </Button>
                </div>
              </div>
            )}

            {templates.length === 0 && editingId !== -1 ? (
              <div className="text-center py-10 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                <MessageSquare className="w-8 h-8 mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500 font-medium">No templates found</p>
                <p className="text-slate-400 text-sm mt-1">Create your first template to get started.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {templates.map(t => (
                  <div key={t.id} className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
                    {editingId === t.id ? (
                      <div className="space-y-4">
                        <div>
                          <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Template Name</label>
                          <Input value={editName} onChange={e => setEditName(e.target.value)} />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Message Text</label>
                          <Textarea value={editText} onChange={e => setEditText(e.target.value)} className="min-h-[100px]" />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                          <Button onClick={handleSave} disabled={updateMutation.isPending}>
                            {updateMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-slate-900">{t.name}</h3>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500" onClick={() => { setEditingId(t.id); setEditName(t.name); setEditText(t.text); }}>
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => { if(confirm("Delete template?")) deleteMutation.mutate({ id: t.id }); }}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 whitespace-pre-wrap">{t.text}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
