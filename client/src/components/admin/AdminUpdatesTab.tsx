import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Megaphone } from "lucide-react";
import { format } from "date-fns";

export function AdminUpdatesTab() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  const { data: updates, refetch } = trpc.appUpdates.getUpdates.useQuery();

  const createMutation = trpc.appUpdates.createUpdateAndBroadcast.useMutation({
    onSuccess: (data) => {
      toast.success(`Update posted and push notification sent to ${data.sentCount} devices!`);
      setTitle("");
      setMessage("");
      setVideoUrl("");
      refetch();
    },
    onError: (e) => toast.error(e.message)
  });

  const deleteMutation = trpc.appUpdates.deleteUpdate.useMutation({
    onSuccess: () => {
      toast.success("Update deleted");
      refetch();
    },
    onError: (e) => toast.error(e.message)
  });

  const handleCreate = () => {
    if (!title || !message) return toast.error("Title and message are required");
    createMutation.mutate({ title, message, videoUrl: videoUrl || undefined });
  };

  return (
    <div className="space-y-8">
      <div className="p-6 rounded-2xl border" style={{ background: "oklch(0.18 0.02 160)", borderColor: "oklch(0.28 0.02 160)" }}>
        <h3 className="font-bold text-xl mb-4 flex items-center gap-2" style={{ color: "oklch(0.97 0.008 10)" }}>
          <Megaphone size={20} style={{ color: "oklch(0.72 0.12 75)" }} />
          Post New Update
        </h3>
        <p className="text-gray-400 mb-6 text-sm">This will permanently post an update to the Habit Tracker app AND send a push notification to all subscribers instantly.</p>
        
        <div className="space-y-4 max-w-2xl">
          <div>
            <label className="text-sm text-gray-400 block mb-1">Title</label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Weekly Check-in: Motivation!" style={{ background: "oklch(0.12 0.01 160)", color: "white", borderColor: "oklch(0.28 0.02 160)" }} />
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-1">Message</label>
            <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Write your encouraging message here..." rows={4} style={{ background: "oklch(0.12 0.01 160)", color: "white", borderColor: "oklch(0.28 0.02 160)" }} />
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-1">Video URL (YouTube or Vimeo Link - Optional)</label>
            <Input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." style={{ background: "oklch(0.12 0.01 160)", color: "white", borderColor: "oklch(0.28 0.02 160)" }} />
          </div>
          <Button onClick={handleCreate} disabled={createMutation.isPending} className="w-full md:w-auto" style={{ background: "oklch(0.72 0.12 75)", color: "oklch(0.22 0.02 160)", fontWeight: "bold" }}>
            {createMutation.isPending ? "Sending..." : "Post & Send Push Notification 📢"}
          </Button>
        </div>
      </div>

      <div>
        <h3 className="font-bold text-xl mb-4" style={{ color: "oklch(0.97 0.008 10)" }}>Past Updates</h3>
        <div className="space-y-4">
          {updates?.map(u => (
            <div key={u.id} className="p-5 rounded-xl border flex flex-col sm:flex-row justify-between gap-4" style={{ background: "oklch(0.18 0.02 160)", borderColor: "oklch(0.28 0.02 160)" }}>
              <div>
                <h4 className="font-bold text-white text-lg">{u.title}</h4>
                <div className="text-xs text-gray-400 mb-2">{format(new Date(u.createdAt), "MMM d, yyyy h:mm a")}</div>
                <p className="text-gray-300 whitespace-pre-wrap text-sm">{u.message}</p>
                {u.videoUrl && (
                  <a href={u.videoUrl} target="_blank" rel="noreferrer" className="text-sm mt-2 inline-block hover:underline" style={{ color: "oklch(0.72 0.12 75)" }}>
                    Attached Video Link
                  </a>
                )}
              </div>
              <div>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => {
                    if (confirm("Delete this update from the app?")) deleteMutation.mutate({ id: u.id });
                  }}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 size={16} className="text-red-400 hover:text-red-300" />
                </Button>
              </div>
            </div>
          ))}
          {updates?.length === 0 && <p className="text-gray-500">No past updates.</p>}
        </div>
      </div>
    </div>
  );
}
