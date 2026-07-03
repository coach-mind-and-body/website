"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Trash2, Plus, ArrowLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Interval {
  startTime: number;
  endTime: number;
  title: string;
  description: string;
}

export default function AdminVideosClient() {
  const { user } = useAuth();
  const router = useRouter();

  if (user?.role !== "admin") {
    return <div className="p-8 text-center text-red-500">Unauthorized</div>;
  }

  const { data: videos, refetch } = trpc.fitness.getVideos.useQuery();

  const addVideoMutation = trpc.fitness.adminAddVideo.useMutation({
    onSuccess: () => {
      toast.success("Video added!");
      refetch();
      setIsOpen(false);
      resetForm();
    },
    onError: (e) => toast.error(e.message)
  });

  const editVideoMutation = trpc.fitness.adminEditVideo.useMutation({
    onSuccess: () => {
      toast.success("Video updated!");
      refetch();
      setIsOpen(false);
      resetForm();
    },
    onError: (e) => toast.error(e.message)
  });

  const deleteVideoMutation = trpc.fitness.adminDeleteVideo.useMutation({
    onSuccess: () => {
      toast.success("Video deleted!");
      refetch();
    },
    onError: (e) => toast.error(e.message)
  });

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [category, setCategory] = useState("");
  const [intervals, setIntervals] = useState<Interval[]>([]);
  const [showImport, setShowImport] = useState(false);
  const [rawTimestamps, setRawTimestamps] = useState("");

  const uniqueCategories = Array.from(new Set(videos?.map(v => v.category) || []));

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setVideoUrl("");
    setCategory("");
    setIntervals([]);
    setShowImport(false);
    setRawTimestamps("");
  };

  const handleEdit = (video: any) => {
    setEditingId(video.id);
    setTitle(video.title);
    setDescription(video.description || "");
    setVideoUrl(video.videoUrl);
    setCategory(video.category);
    try {
      if (video.intervalsJson) {
        setIntervals(JSON.parse(video.intervalsJson));
      } else {
        setIntervals([]);
      }
    } catch {
      setIntervals([]);
    }
    setIsOpen(true);
  };

  const handleSave = () => {
    if (!title || !videoUrl || !category) return toast.error("Please fill required fields");
    
    // Sort intervals by start time
    const sortedIntervals = [...intervals].sort((a, b) => a.startTime - b.startTime);
    const intervalsJson = sortedIntervals.length > 0 ? JSON.stringify(sortedIntervals) : undefined;

    if (editingId) {
      editVideoMutation.mutate({
        id: editingId,
        title,
        description,
        videoUrl,
        category,
        intervalsJson,
        order: 0,
      });
    } else {
      addVideoMutation.mutate({
        title,
        description,
        videoUrl,
        category,
        intervalsJson,
        order: 0,
      });
    }
  };

  const formatSecondsToMMSS = (seconds: number) => {
    if (isNaN(seconds)) return "00:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const parseMMSStoSeconds = (mmss: string) => {
    const parts = mmss.split(":");
    if (parts.length === 2) {
      return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }
    return parseInt(mmss) || 0;
  };

  const addInterval = () => {
    setIntervals([...intervals, { startTime: 0, endTime: 30, title: "", description: "" }]);
  };

  const updateInterval = (index: number, field: keyof Interval, value: any) => {
    const newIntervals = [...intervals];
    newIntervals[index] = { ...newIntervals[index], [field]: value };
    setIntervals(newIntervals);
  };

  const parseTimestamps = () => {
    const lines = rawTimestamps.split('\n');
    const newIntervals: Interval[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].trim().match(/^(\d{1,2}:\d{2}(?::\d{2})?)\s+(.+)$/);
      if (match) {
        newIntervals.push({
          startTime: parseMMSStoSeconds(match[1]),
          endTime: 0,
          title: match[2].trim(),
          description: ""
        });
      }
    }
    
    for (let i = 0; i < newIntervals.length; i++) {
      if (i < newIntervals.length - 1) {
        newIntervals[i].endTime = newIntervals[i + 1].startTime;
      } else {
        newIntervals[i].endTime = newIntervals[i].startTime + 60; // Default 1 min for the last chapter
      }
    }
    
    if (newIntervals.length > 0) {
      setIntervals([...intervals, ...newIntervals]);
      toast.success(`Imported ${newIntervals.length} timestamps!`);
    } else {
      toast.error("No valid timestamps found. Format: MM:SS Chapter Title");
    }
    
    setRawTimestamps("");
    setShowImport(false);
  };

  const removeInterval = (index: number) => {
    setIntervals(intervals.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Workout Videos</h2>
          <p className="text-gray-500 mt-1">Manage the video library for the Fitness Tracker.</p>
        </div>
        <Button onClick={() => { resetForm(); setIsOpen(true); }} className="bg-black text-white rounded-full">
            <Plus size={18} className="mr-2" /> Add Video
          </Button>
        </div>

        {isOpen && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
            <h3 className="font-bold text-lg border-b pb-2">{editingId ? "Edit Video" : "New Video"}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Title *</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-3 rounded-lg border mt-1" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Category *</label>
                <input type="text" list="video-categories" value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. Upper Body, Yoga" className="w-full p-3 rounded-lg border mt-1" />
                <datalist id="video-categories">
                  {uniqueCategories.map(cat => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-gray-500 uppercase">YouTube/Vimeo URL *</label>
                <input type="url" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} className="w-full p-3 rounded-lg border mt-1" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full p-3 rounded-lg border mt-1 h-24" />
              </div>
            </div>

            {/* Intervals Section */}
            <div className="pt-4 border-t border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h4 className="font-bold text-md text-gray-900">Interactive Timer Intervals (Optional)</h4>
                  <p className="text-xs text-gray-500">Define exercises with start/end times so the app can show a synchronized timer.</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowImport(!showImport)}>
                    Import Timestamps
                  </Button>
                  <Button variant="outline" size="sm" onClick={addInterval}>
                    <Plus size={14} className="mr-2" /> Add Interval
                  </Button>
                </div>
              </div>

              {showImport && (
                <div className="mb-4 p-4 border rounded-lg bg-gray-50">
                  <label className="text-xs font-bold text-gray-700 block mb-2">Paste Descript/YouTube Timestamps (e.g. "00:00 Warmup")</label>
                  <textarea 
                    value={rawTimestamps} 
                    onChange={e => setRawTimestamps(e.target.value)} 
                    className="w-full h-32 p-3 border rounded-lg mb-2 text-sm font-mono"
                    placeholder="00:00 Intro&#10;01:30 Jumping Jacks&#10;02:15 Squats"
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setShowImport(false)}>Cancel</Button>
                    <Button size="sm" onClick={parseTimestamps} className="bg-blue-600 text-white hover:bg-blue-700">Parse</Button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {intervals.map((interval, i) => (
                  <div key={i} className="flex flex-col md:flex-row gap-2 bg-gray-50 p-3 rounded-lg items-end">
                    <div className="w-full md:w-24">
                      <label className="text-xs font-bold text-gray-500 block mb-1">Start (MM:SS)</label>
                      <input 
                        type="text" 
                        value={formatSecondsToMMSS(interval.startTime)}
                        onChange={(e) => updateInterval(i, 'startTime', parseMMSStoSeconds(e.target.value))}
                        className="w-full p-2 text-sm rounded border bg-white" 
                        placeholder="00:00"
                      />
                    </div>
                    <div className="w-full md:w-24">
                      <label className="text-xs font-bold text-gray-500 block mb-1">End (MM:SS)</label>
                      <input 
                        type="text" 
                        value={formatSecondsToMMSS(interval.endTime)}
                        onChange={(e) => updateInterval(i, 'endTime', parseMMSStoSeconds(e.target.value))}
                        className="w-full p-2 text-sm rounded border bg-white" 
                        placeholder="00:30"
                      />
                    </div>
                    <div className="flex-1 w-full">
                      <label className="text-xs font-bold text-gray-500 block mb-1">Exercise Name</label>
                      <input 
                        type="text" 
                        value={interval.title}
                        onChange={(e) => updateInterval(i, 'title', e.target.value)}
                        className="w-full p-2 text-sm rounded border bg-white" 
                        placeholder="e.g. Jumping Jacks"
                      />
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeInterval(i)} className="text-red-500 hover:text-red-700 hover:bg-red-50 h-[38px] w-[38px] p-0 flex-shrink-0">
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ))}
                {intervals.length === 0 && (
                  <div className="text-sm text-gray-400 p-4 border border-dashed rounded-lg text-center">
                    No intervals defined. The video will play normally without on-screen timers.
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={addVideoMutation.isPending || editVideoMutation.isPending} className="bg-blue-600 text-white hover:bg-blue-700">
                {(addVideoMutation.isPending || editVideoMutation.isPending) ? "Saving..." : "Save Video"}
              </Button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-bold">
              <tr>
                <th className="p-4">Title</th>
                <th className="p-4">Category</th>
                <th className="p-4">URL & Intervals</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {videos?.map(video => {
                let parsedIntervals = [];
                try {
                  if (video.intervalsJson) parsedIntervals = JSON.parse(video.intervalsJson);
                } catch {}

                return (
                  <tr key={video.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="p-4 font-medium">{video.title}</td>
                    <td className="p-4"><span className="bg-gray-100 px-2 py-1 rounded-md text-xs">{video.category}</span></td>
                    <td className="p-4 text-sm">
                      <a href={video.videoUrl} target="_blank" rel="noreferrer" className="text-blue-500 truncate block max-w-xs">{video.videoUrl}</a>
                      {parsedIntervals.length > 0 && (
                        <span className="inline-block mt-1 bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold">
                          {parsedIntervals.length} Intervals
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(video)} className="text-gray-500 hover:text-blue-600 mr-2">
                        <Pencil size={16} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => {
                        if (confirm("Delete this video?")) {
                          deleteVideoMutation.mutate({ id: video.id });
                        }
                      }} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                        <Trash2 size={16} />
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {videos?.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">No videos added yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
  );
}
