// @ts-nocheck
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function AdminChallengesTab() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(7);

  const { data: challenges, refetch } = trpc.challenges.getActiveChallenges.useQuery();

  const createChallengeMutation = trpc.challenges.createChallenge.useMutation({
    onSuccess: () => {
      toast.success("Challenge created!");
      setTitle("");
      setDescription("");
      setDuration(7);
      refetch();
    },
    onError: (e) => toast.error(e.message)
  });

  const broadcastMutation = trpc.push.broadcastChallenge.useMutation({
    onSuccess: (data) => toast.success(`Push notification sent to ${data.sentCount} devices!`),
    onError: (e) => toast.error(e.message)
  });

  const handleCreate = () => {
    if (!title) return toast.error("Title is required");
    createChallengeMutation.mutate({ title, description, durationDays: duration });
  };

  return (
    <div>
      <h2 className="font-bold text-2xl mb-6" style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.20 0.015 50)" }}>Manage Challenges</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-6 rounded-2xl border" style={{ background: "oklch(0.96 0.025 50)", borderColor: "oklch(0.90 0.015 80)" }}>
          <h3 className="font-bold text-lg mb-4" style={{ color: "oklch(0.20 0.015 50)" }}>Create New Challenge</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm block mb-1" style={{ color: "oklch(0.42 0.015 50)" }}>Title</label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. 7 Days of Hydration" style={{ background: "oklch(0.985 0.008 80)", color: "oklch(0.20 0.015 50)", borderColor: "oklch(0.90 0.015 80)" }} />
            </div>
            <div>
              <label className="text-sm block mb-1" style={{ color: "oklch(0.42 0.015 50)" }}>Description</label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Short description of the challenge..." style={{ background: "oklch(0.985 0.008 80)", color: "oklch(0.20 0.015 50)", borderColor: "oklch(0.90 0.015 80)" }} />
            </div>
            <div>
              <label className="text-sm block mb-1" style={{ color: "oklch(0.42 0.015 50)" }}>Duration (Days)</label>
              <Input type="number" value={duration} onChange={e => setDuration(Number(e.target.value))} style={{ background: "oklch(0.985 0.008 80)", color: "oklch(0.20 0.015 50)", borderColor: "oklch(0.90 0.015 80)" }} />
            </div>
            <Button onClick={handleCreate} disabled={createChallengeMutation.isPending} style={{ background: "oklch(0.72 0.12 75)", color: "oklch(1 0 0)" }}>
              {createChallengeMutation.isPending ? "Creating..." : "Create Challenge"}
            </Button>
          </div>
        </div>

        <div>
          <h3 className="font-bold text-lg mb-4" style={{ color: "oklch(0.20 0.015 50)" }}>Active Challenges</h3>
          <div className="space-y-4">
            {challenges?.map(c => (
              <div key={c.id} className="p-4 rounded-xl border flex flex-col gap-2" style={{ borderColor: "oklch(0.90 0.015 80)", background: "oklch(1 0 0)" }}>
                <div>
                  <div className="font-bold" style={{ color: "oklch(0.20 0.015 50)" }}>{c.title}</div>
                  <div className="text-sm" style={{ color: "oklch(0.52 0.015 50)" }}>{c.durationDays} days</div>
                </div>
                <div className="mt-2 flex justify-end">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => broadcastMutation.mutate({ challengeId: c.id })}
                    disabled={broadcastMutation.isPending}
                    style={{ borderColor: "oklch(0.72 0.12 75)", color: "oklch(0.72 0.12 75)" }}
                  >
                    {broadcastMutation.isPending ? "Sending..." : "Send Push Notification \uD83D\uDCE3"}
                  </Button>
                </div>
              </div>
            ))}
            {challenges?.length === 0 && <p className="text-gray-500">No active challenges.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
