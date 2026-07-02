import { useState } from "react";
import { Phone, PhoneCall, PhoneIncoming, PhoneMissed } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function CallHistory() {
  const { data, isLoading } = trpc.crmAutomations.getCallLogs.useQuery(undefined, {
    refetchInterval: 10000
  });

  const [filter, setFilter] = useState<'All'|'Answered'|'Missed'|'Voicemail'|'Inbound'|'Outbound'>('All');

  const calls = data?.calls || [];
  
  const filteredCalls = calls.filter(call => {
    if (filter === 'All') return true;
    if (filter === 'Inbound') return call.direction === 'inbound';
    if (filter === 'Outbound') return call.direction === 'outbound';
    if (filter === 'Missed') return call.status === 'no-answer';
    if (filter === 'Answered') return call.status === 'completed';
    return true;
  });

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-transparent">
      <div className="p-6 border-b bg-white rounded-t-xl flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Call History</h1>
        </div>
        <div className="text-sm text-muted-foreground">{filteredCalls.length} calls</div>
      </div>

      <div className="flex gap-4 px-6 pt-4 bg-white border-b overflow-x-auto">
        {['All', 'Answered', 'Missed', 'Voicemail', 'Inbound', 'Outbound'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab as any)}
            className={`pb-3 px-1 border-b-2 text-sm font-medium transition-colors ${
              filter === tab ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-6 bg-white rounded-b-xl border border-t-0 shadow-sm">
        {isLoading ? (
          <div className="flex justify-center py-8 text-muted-foreground">Loading call history...</div>
        ) : filteredCalls.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No calls found.</div>
        ) : (
          <div className="space-y-6">
            {filteredCalls.map((call, i) => {
              const d = new Date(call.startTime);
              const isMissed = call.status !== 'completed' && call.status !== 'in-progress';
              const isInbound = call.direction === 'inbound';
              
              // To make it look like the screenshot with the green/orange bubbles
              const bgColor = isMissed ? 'bg-orange-500' : 'bg-emerald-500';
              const icon = isMissed ? <PhoneMissed className="w-4 h-4 text-white" /> : 
                           isInbound ? <PhoneIncoming className="w-4 h-4 text-white" /> : 
                           <PhoneCall className="w-4 h-4 text-white" />;

              return (
                <div key={call.sid} className="flex flex-col py-4 border-b last:border-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${bgColor}`}>
                        {icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {call.contactName || (isInbound ? call.from : call.to)}
                          </span>
                          <span className="text-xs text-muted-foreground">{call.duration ? `${call.duration}s` : ''}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="w-3 h-3" />
                          <span>
                            {call.contactName ? (isInbound ? call.from : call.to) : call.status}
                            {call.contactName ? ` · ${call.status}` : ""}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground text-right">
                      <div>{d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      <div className="text-xs">{d.toLocaleDateString()}</div>
                    </div>
                  </div>
                  
                  {/* AI Summary and Transcript */}
                  {(call.aiSummary || call.transcript) && (
                    <div className="mt-3 ml-12">
                      <details className="group border border-slate-200 rounded-lg bg-slate-50 overflow-hidden [&_summary::-webkit-details-marker]:hidden">
                        <summary className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-100 transition-colors">
                          <span className="flex items-center gap-2">
                            ✨ View AI Summary & Transcript
                          </span>
                        </summary>
                        <div className="px-4 py-3 bg-white border-t border-slate-100 space-y-3">
                          {call.aiSummary && (
                            <div>
                              <h4 className="text-xs font-bold text-slate-800 mb-1 uppercase tracking-wider">AI Summary</h4>
                              <div className="text-xs text-slate-600 whitespace-pre-wrap">{call.aiSummary}</div>
                            </div>
                          )}
                          {call.transcript && (
                            <div>
                              <h4 className="text-xs font-bold text-slate-800 mb-1 uppercase tracking-wider">Raw Transcript</h4>
                              <div className="text-[11px] text-slate-500 whitespace-pre-wrap font-mono bg-slate-50 p-2 rounded border border-slate-100 max-h-40 overflow-y-auto">
                                {call.transcript}
                              </div>
                            </div>
                          )}
                        </div>
                      </details>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
