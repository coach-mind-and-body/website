// @ts-nocheck
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { Loader2, Star, UserPlus, Calendar, ArrowUpRight, ArrowDownLeft } from "lucide-react";

export default function ActivityFeed() {
  const { data: activities, isLoading } = trpc.messaging.listFeed.useQuery();

  if (isLoading) {
    return <div className="flex justify-center p-12 text-brand-blue"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500">
        <Calendar className="w-12 h-12 mb-4 text-slate-300" />
        <p>No recent activity found.</p>
      </div>
    );
  }

  // Group by date
  const grouped = activities.reduce((acc, curr) => {
    const dateStr = format(new Date(curr.date), 'EEEE, MMMM d, yyyy');
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(curr);
    return acc;
  }, {} as Record<string, typeof activities>);

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="flex items-center justify-center h-14 border-b shrink-0 bg-white shadow-sm sticky top-0 z-10">
        <h1 className="text-lg font-semibold text-slate-900">Activity Feed</h1>
      </div>
      
      <div className="flex-1 overflow-auto p-0 md:p-4">
        <div className="max-w-2xl mx-auto bg-white md:rounded-xl md:shadow-sm md:border overflow-hidden">
          {(Object.entries(grouped) as [string, any[]][]).map(([dateLabel, items]) => (
            <div key={dateLabel}>
              <div className="bg-slate-50 px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider border-y first:border-t-0">
                {dateLabel}
              </div>
              <div className="divide-y">
                {items.map((item) => (
                  <div key={item.id} className="p-4 flex gap-4 hover:bg-slate-50 transition-colors">
                    <div className="shrink-0 mt-1">
                      {item.type === 'message' && item.direction === 'inbound' && <ArrowDownLeft className="w-5 h-5 text-emerald-500" />}
                      {item.type === 'message' && item.direction === 'outbound' && <ArrowUpRight className="w-5 h-5 text-blue-500" />}
                      {item.type === 'review' && <Star className="w-5 h-5 text-yellow-500" fill="currentColor" />}
                      {item.type === 'quote' && <UserPlus className="w-5 h-5 text-purple-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <span className="font-semibold text-slate-900">{item.name || item.phone || 'Unknown Contact'}</span>
                          {item.type === 'message' && <span className="text-slate-500 text-sm ml-1">via SMS</span>}
                          {item.type === 'review' && <span className="text-slate-500 text-sm ml-1">left a review</span>}
                          {item.type === 'quote' && <span className="text-slate-500 text-sm ml-1">requested a quote</span>}
                        </div>
                        <span className="text-xs text-slate-400 whitespace-nowrap ml-2">
                          {format(new Date(item.date), 'h:mm a')}
                        </span>
                      </div>
                      {item.name && item.phone && (
                        <div className="text-sm text-slate-500 mb-1">{item.phone}</div>
                      )}
                      <div className="text-sm text-slate-700 line-clamp-2 leading-relaxed">
                        {item.content || ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
