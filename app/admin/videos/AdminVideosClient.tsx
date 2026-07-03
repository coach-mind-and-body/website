"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Trash2, Plus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

  const deleteVideoMutation = trpc.fitness.adminDeleteVideo.useMutation({
    onSuccess: () => {
      toast.success("Video deleted!");
      refetch();
    },
    onError: (e) => toast.error(e.message)
  });

  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [category, setCategory] = useState("");

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setVideoUrl("");
    setCategory("");
  };

  const handleSave = () => {
    if (!title || !videoUrl || !category) return toast.error("Please fill required fields");
    addVideoMutation.mutate({
      title,
      description,
      videoUrl,
      category,
      order: 0,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.push("/admin")}>
            <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
          </Button>
        </div>

        <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Workout Videos</h1>
            <p className="text-gray-500 mt-1">Manage the video library for the Fitness Tracker.</p>
          </div>
          <Button onClick={() => setIsOpen(true)} className="bg-black text-white rounded-full">
            <Plus size={18} className="mr-2" /> Add Video
          </Button>
        </div>

        {isOpen && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <h3 className="font-bold text-lg border-b pb-2">New Video</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Title *</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-3 rounded-lg border mt-1" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Category *</label>
                <input type="text" value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. Upper Body, Yoga" className="w-full p-3 rounded-lg border mt-1" />
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

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={addVideoMutation.isPending} className="bg-blue-600 text-white hover:bg-blue-700">
                {addVideoMutation.isPending ? "Saving..." : "Save Video"}
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
                <th className="p-4">URL</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {videos?.map(video => (
                <tr key={video.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="p-4 font-medium">{video.title}</td>
                  <td className="p-4"><span className="bg-gray-100 px-2 py-1 rounded-md text-xs">{video.category}</span></td>
                  <td className="p-4 text-sm text-blue-500"><a href={video.videoUrl} target="_blank" rel="noreferrer" className="truncate block max-w-xs">{video.videoUrl}</a></td>
                  <td className="p-4 text-right">
                    <Button variant="ghost" size="sm" onClick={() => {
                      if (confirm("Delete this video?")) {
                        deleteVideoMutation.mutate({ id: video.id });
                      }
                    }} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                      <Trash2 size={16} />
                    </Button>
                  </td>
                </tr>
              ))}
              {videos?.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">No videos added yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
