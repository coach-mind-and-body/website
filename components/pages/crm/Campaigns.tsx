// @ts-nocheck
import { useState, useMemo } from "react";
import { Megaphone, Plus, Tag, Upload, ArrowRight, ArrowLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
// Mock getDealDestinationEmoji to fix build error
function getDealDestinationEmoji(dest: string) { return "✈️"; }

function formatNumber(n: number): string {
  return n?.toLocaleString() || "0";
}

function formatDateFriendly(dateStr: string) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function Campaigns() {
  const utils = trpc.useUtils();
  const { data: campaigns = [], isLoading: loading } = trpc.crmAutomations.listCampaigns.useQuery();
  const { data: deals = [] } = trpc.adminDeals.all.useQuery();
  
  const [showWizard, setShowWizard] = useState(false);
  const [step, setStep] = useState<1|2|3>(1);

  // Wizard State — default to premium subscribers (primary FDF audience)
  const [campaignName, setCampaignName] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<'csv'|'tag'|'contacts'|'manual'|null>('tag');
  const [selectedTag, setSelectedTag] = useState<string>("-1");
  const [message, setMessage] = useState("\n\nText STOP to unsubscribe");
  const [mediaUrl, setMediaUrl] = useState("");
  const [closeAfterSend, setCloseAfterSend] = useState(false);
  const [scheduleForLater, setScheduleForLater] = useState(false);

  // Deal Picker State
  const [showDealPicker, setShowDealPicker] = useState(false);
  const [dealSearch, setDealSearch] = useState("");
  const [selectedDeals, setSelectedDeals] = useState<any[]>([]);

  // Filter deals for the picker
  const filteredDeals = useMemo(() => {
    if (!dealSearch) return deals.filter((d: any) => d.status === "active");
    const s = dealSearch.toLowerCase();
    return deals.filter(
      (d: any) =>
        d.status === "active" &&
        (d.destination?.toLowerCase().includes(s) ||
          d.origin?.toLowerCase().includes(s) ||
          d.airlines?.some((a: any) => a.name?.toLowerCase().includes(s)))
    );
  }, [deals, dealSearch]);

  const toggleDeal = (deal: any) => {
    setSelectedDeals(prev => 
      prev.find(d => d.id === deal.id) 
        ? prev.filter(d => d.id !== deal.id)
        : [...prev, deal]
    );
  };

  const generateSmsText = () => {
    if (selectedDeals.length === 0) {
      toast.error("Please select at least one deal.");
      return;
    }

    const byOrigin: Record<string, any[]> = {};
    selectedDeals.forEach(d => {
      const origin = d.origin ? d.origin.split(" ")[0].replace(/[()]/g, "") : "SLC";
      if (!byOrigin[origin]) byOrigin[origin] = [];
      byOrigin[origin].push(d);
    });

    let smsText = "((first_name)), it's Flight Deal Friday with Mind and Body!✈️\n";

    Object.keys(byOrigin).forEach(origin => {
      smsText += `\n${origin}\n`;
      byOrigin[origin].forEach(d => {
        const emoji = getDealDestinationEmoji(d.destination);
        let cleanCity = d.destination.split(",")[0].trim();
        cleanCity = cleanCity.replace(/^(\p{Extended_Pictographic}+\s*)+/u, "").trim();
        cleanCity = cleanCity.replace(/[:;]$/, "");

        const price = `$${d.price}`;
        let dates = "";
        if (d.main_dates) {
          dates = d.main_dates;
        } else if (d.main_start) {
           const startMonth = formatDateFriendly(d.main_start).split(" ");
           dates = `${startMonth[0]} ${startMonth[1]?.replace(",","")}`;
           if (d.main_end) {
             const endMonth = formatDateFriendly(d.main_end).split(" ");
             dates += ` – ${endMonth[0]} ${endMonth[1]?.replace(",","")}`;
           }
        }
        
        let airline = d.airlines?.[0]?.name || "Various";
        let priceStr = price;
        if (d.pricingMode === 'miles') {
           priceStr = `${formatNumber(Number(d.pointsPrice))} Pts`;
        }
        
        const cleanSlug = cleanCity.replace(/[^a-zA-Z0-9]/g, "");
        const link = `https://utahtravel.pro/${cleanSlug}`;
        
        smsText += `${emoji} ${cleanCity}: ${priceStr} ${dates} • ${airline} ${link}\n`;
      });
    });

    const footer = message.includes("STOP to unsubscribe")
      ? ""
      : "\n\nText STOP to unsubscribe";
    setMessage(`${smsText.trim()}${footer}`);
    setShowDealPicker(false);
    toast.success("Flight Deal Friday template inserted!");
  };

  const audienceTagId = selectedMethod === 'tag' && selectedTag ? parseInt(selectedTag) : -1;
  const { data: audienceCount } = trpc.crmAutomations.getCampaignAudienceCount.useQuery(
    { targetTagId: audienceTagId },
    { enabled: selectedMethod === 'tag' && !!selectedTag }
  );

  const startFlightDealFriday = () => {
    setShowWizard(true);
    setStep(1);
    setCampaignName(`Flight Deal Friday ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`);
    setSelectedMethod('tag');
    setSelectedTag('-1');
    setMessage("\n\nText STOP to unsubscribe");
    setSelectedDeals([]);
  };

  const createCampaign = trpc.crmAutomations.createCampaign.useMutation({
    onSuccess: () => {
      toast.success("Campaign launched successfully!");
      setShowWizard(false);
      setStep(1);
      setCampaignName("");
      setMessage("\n\nText STOP to unsubscribe");
      utils.crmAutomations.listCampaigns.invalidate();
    },
    onError: (err) => {
      toast.error(err.message, { duration: 8000 });
    },
  });

  const handleSend = () => {
    if (!campaignName || !message) {
      toast.error("Please provide a name and message");
      return;
    }
    if (selectedMethod === 'tag' && !selectedTag) {
      toast.error("Please select a target tag");
      return;
    }
    
    createCampaign.mutate({
      name: campaignName,
      targetTagId: selectedMethod === 'tag' ? parseInt(selectedTag) : undefined,
      messageBody: message,
      mediaUrl: mediaUrl,
      scheduleForLater: scheduleForLater
    });
  };

  if (!showWizard) {
    return (
      <div className="flex-1 flex flex-col min-w-0 bg-transparent">
        <div className="p-6 border-b bg-white rounded-t-xl flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Campaigns</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage bulk SMS and email blasts.</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={startFlightDealFriday} className="bg-brand-orange hover:bg-brand-orange/90 text-white">
              ✈️ Flight Deal Friday
            </Button>
            <Button onClick={() => { setShowWizard(true); setSelectedMethod('tag'); setSelectedTag('-1'); }} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              New Campaign
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6 bg-white rounded-b-xl border border-t-0 shadow-sm">
          <div className="max-w-5xl space-y-8">
            {loading ? (
              <div className="flex justify-center p-12 text-brand-blue"><Loader2 className="w-8 h-8 animate-spin" /></div>
            ) : campaigns.length === 0 ? (
              <div className="text-center py-10 border border-dashed rounded-xl bg-slate-50 text-muted-foreground">
                <Megaphone className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-semibold text-slate-900 mb-1">No campaigns yet</h3>
                <p>Create your first broadcast to engage your customers at scale.</p>
                <Button onClick={() => setShowWizard(true)} className="mt-4 bg-brand-blue hover:bg-brand-blue/90 text-white">
                  Get Started
                </Button>
              </div>
            ) : (
              <div className="border rounded-xl overflow-x-auto bg-white shadow-sm">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 border-b">
                    <tr>
                      <th className="px-6 py-3 font-medium">Campaign Name</th>
                      <th className="px-6 py-3 font-medium">Status</th>
                      <th className="px-6 py-3 font-medium">Delivered</th>
                      <th className="px-6 py-3 font-medium">Scheduled / Sent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map(camp => (
                      <tr key={camp.id} className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-900">{camp.name}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold
                            ${camp.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                              camp.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                              camp.status === 'failed' ? 'bg-red-100 text-red-700' :
                              'bg-slate-100 text-slate-700'}`}>
                            {camp.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {camp.status === 'completed' || camp.status === 'sending' ? (
                            <span>
                              <span className="text-emerald-600 font-medium">{camp.sentCount ?? 0}</span>
                              {(camp.failedCount ?? 0) > 0 && (
                                <span className="text-red-500 ml-2">/ {camp.failedCount} failed</span>
                              )}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {new Date(camp.scheduledAt || camp.createdAt).toLocaleString([], { 
                            month: 'numeric', day: 'numeric', year: 'numeric', 
                            hour: 'numeric', minute: '2-digit' 
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-transparent">
      {/* Wizard Header */}
      <div className="p-6 border-b bg-white rounded-t-xl">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Create Campaign</h1>
          <Button variant="ghost" onClick={() => setShowWizard(false)}>Cancel</Button>
        </div>
        
        {/* Stepper */}
        <div className="max-w-4xl mx-auto mt-8 flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 -z-10 rounded-full overflow-hidden">
            <div className="h-full bg-brand-blue transition-all" style={{ width: step === 1 ? '10%' : step === 2 ? '50%' : '100%' }} />
          </div>
          {[1, 2, 3].map(s => (
            <div key={s} className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center font-bold border-4 transition-colors ${
              step >= s ? "bg-brand-blue border-white text-white shadow-md" : "bg-slate-100 border-white text-slate-400"
            }`}>
              {s}
            </div>
          ))}
        </div>
        <div className="max-w-4xl mx-auto flex items-center justify-between mt-2 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500">
          <span className="text-center w-10">Add<br className="sm:hidden"/> Customers</span>
          <span className="text-center w-10">Write<br className="sm:hidden"/> Message</span>
          <span className="text-center w-10">Set<br className="sm:hidden"/> Options</span>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 bg-white rounded-b-xl border border-t-0 shadow-sm">
        <div className="max-w-4xl mx-auto py-4">
          
          {/* STEP 1: ADD CUSTOMERS */}
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Step 1: Add customers</h2>
                <p className="text-slate-500 mt-1">Choose how to add customers to this campaign.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg">
                <button onClick={() => setSelectedMethod('tag')} className={`p-6 border-2 rounded-xl flex flex-col items-center justify-center text-center gap-3 transition-all ${selectedMethod === 'tag' ? 'border-brand-blue bg-blue-50 text-brand-blue' : 'border-slate-200 hover:border-slate-300 text-slate-600'}`}>
                  <Tag className="w-8 h-8" />
                  <span className="font-semibold text-sm">Select audience</span>
                </button>
              </div>

              {selectedMethod === 'tag' && (
                <div className="space-y-2 max-w-sm mt-4 animate-in fade-in slide-in-from-top-2">
                  <label className="text-sm font-semibold text-slate-900">Target Audience Tag</label>
                  <Select value={selectedTag} onValueChange={setSelectedTag}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a group..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="-1">All Premium Subscribers (recommended)</SelectItem>
                      <SelectItem value="-2">Free Flight Deal Subscribers</SelectItem>
                    </SelectContent>
                  </Select>
                  {audienceCount && (
                    <p className="text-xs text-brand-blue font-medium mt-1">
                      {audienceCount.withPhone} subscribers with phone numbers ready to receive SMS
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">Audience is resolved at send time from live premium status.</p>
                </div>
              )}

              <div className="space-y-2 max-w-sm mt-6">
                <label className="text-sm font-semibold text-slate-900">Campaign Name (Internal)</label>
                <Input value={campaignName} onChange={e => setCampaignName(e.target.value)} placeholder="e.g., Summer Disney Deals 2026" />
              </div>
            </div>
          )}

          {/* STEP 2: WRITE MESSAGE */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Step 2: Write your message</h2>
                <p className="text-slate-500 mt-1">Compose the message that will be broadcasted to your selected customers.</p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex gap-2 items-center flex-wrap">
                    <Button variant="outline" size="sm" onClick={() => setMessage(p => p + "((first_name))")} className="text-xs">((first_name))</Button>
                    <Button variant="outline" size="sm" onClick={() => setMessage(p => p + "((last_name))")} className="text-xs">((last_name))</Button>
                    <Button variant="outline" size="sm" onClick={() => setMessage(p => p + "((review_link))")} className="text-xs">((review_link))</Button>
                    <div className="w-px h-4 bg-slate-300 mx-1"></div>
                    <Button variant="secondary" size="sm" onClick={() => setShowDealPicker(true)} className="text-xs bg-brand-blue/10 text-brand-blue hover:bg-brand-blue/20">✈️ Flight Deal Friday Template</Button>
                  </div>
                  <Textarea 
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Type your campaign message here..."
                    className="min-h-[250px] resize-none text-base p-4 leading-relaxed"
                  />
                  <div className="text-xs text-slate-500 text-right">{message.length} characters • {Math.ceil((message.length || 1)/160)} SMS message(s)</div>
                  
                  <div className="mt-4 pt-4 border-t">
                    <label className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-2">
                      <Upload className="w-4 h-4 text-brand-blue" /> Attach Image (MMS)
                    </label>
                    <Input 
                      value={mediaUrl}
                      onChange={e => setMediaUrl(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-slate-500 mt-1">Provide a direct URL to an image or GIF to send an MMS picture message.</p>
                  </div>
                </div>

                {/* Mobile Preview */}
                <div className="bg-slate-100 rounded-3xl p-4 md:p-8 flex items-center justify-center">
                  <div className="w-[300px] h-[600px] bg-white rounded-[40px] shadow-2xl border-[8px] border-slate-800 overflow-hidden flex flex-col relative">
                    <div className="bg-slate-100 p-4 text-center font-semibold text-sm border-b z-10 shrink-0">
                      Carter Seitz (Preview)
                    </div>
                    <div className="flex-1 p-4 bg-slate-50 overflow-y-auto flex flex-col justify-end gap-2">
                      {mediaUrl && (
                        <div className="max-w-[85%] self-end">
                          <img src={mediaUrl} alt="MMS Preview" className="rounded-2xl shadow-sm object-cover" />
                        </div>
                      )}
                      {message && (
                        <div className="bg-blue-500 text-white p-3 rounded-2xl rounded-br-sm max-w-[85%] self-end text-[15px] leading-snug whitespace-pre-wrap shadow-sm">
                          {message.replace('((first_name))', 'Carter').replace('((last_name))', 'Seitz').replace('((review_link))', 'https://coachmindandbody.com/review')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: OPTIONS AND SEND */}
          {step === 3 && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500 max-w-2xl">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Step 3: Set options and send</h2>
                <p className="text-slate-500 mt-1">Configure final delivery settings before launching your campaign.</p>
              </div>

              <div className="space-y-6">
                {/* Status After Send */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-900">What should the conversation status be after sending the message?</label>
                  <div className="flex flex-col md:flex-row gap-4">
                    <label className={`flex items-center gap-3 p-4 border rounded-xl flex-1 cursor-pointer transition-colors ${closeAfterSend ? 'bg-slate-50 border-slate-200' : 'bg-blue-50 border-brand-blue ring-1 ring-brand-blue'}`}>
                      <input type="radio" checked={!closeAfterSend} onChange={() => setCloseAfterSend(false)} className="w-4 h-4 text-brand-blue shrink-0" />
                      <span className="font-medium text-slate-900">Leave as is</span>
                    </label>
                    <label className={`flex items-center gap-3 p-4 border rounded-xl flex-1 cursor-pointer transition-colors ${closeAfterSend ? 'bg-blue-50 border-brand-blue ring-1 ring-brand-blue' : 'bg-slate-50 border-slate-200'}`}>
                      <input type="radio" checked={closeAfterSend} onChange={() => setCloseAfterSend(true)} className="w-4 h-4 text-brand-blue shrink-0" />
                      <span className="font-medium text-slate-900">Close conversation</span>
                    </label>
                  </div>
                </div>

                {/* Delivery Timing */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-900">When do you want to send this campaign?</label>
                  <div className="flex flex-col md:flex-row gap-4">
                    <label className={`flex items-center gap-3 p-4 border rounded-xl flex-1 cursor-pointer transition-colors ${scheduleForLater ? 'bg-slate-50 border-slate-200' : 'bg-blue-50 border-brand-blue ring-1 ring-brand-blue'}`}>
                      <input type="radio" checked={!scheduleForLater} onChange={() => setScheduleForLater(false)} className="w-4 h-4 text-brand-blue shrink-0" />
                      <span className="font-medium text-slate-900">Send immediately</span>
                    </label>
                    <label className={`flex items-center gap-3 p-4 border rounded-xl flex-1 cursor-pointer transition-colors ${scheduleForLater ? 'bg-blue-50 border-brand-blue ring-1 ring-brand-blue' : 'bg-slate-50 border-slate-200'}`}>
                      <input type="radio" checked={scheduleForLater} onChange={() => setScheduleForLater(true)} className="w-4 h-4 text-brand-blue shrink-0" />
                      <span className="font-medium text-slate-900">Schedule for later</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
                <p className="text-sm text-amber-800 font-medium">Please review all settings carefully. Once a campaign is launched, it cannot be undone.</p>
                <p className="text-sm text-amber-700">Click <strong>Launch Campaign</strong> only once. If it errors, check the campaigns list before retrying — duplicate launches will text everyone twice.</p>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="mt-12 pt-6 border-t flex justify-between items-center">
            {step > 1 ? (
              <Button variant="outline" onClick={() => setStep(step - 1 as any)}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
            ) : <div />}

            {step < 3 ? (
              <Button 
                onClick={() => setStep(step + 1 as any)} 
                className="bg-brand-blue hover:bg-brand-blue/90 text-white"
                disabled={step === 1 && !campaignName}
              >
                Next Step <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={handleSend} 
                disabled={createCampaign.isPending}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-8"
              >
                {createCampaign.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Launch Campaign
              </Button>
            )}
          </div>
          
        </div>
      </div>

      {/* Deal Picker Modal */}
      <Dialog open={showDealPicker} onOpenChange={setShowDealPicker}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 bg-white">
          <DialogHeader className="p-4 border-b">
            <DialogTitle>Select Flight Deals</DialogTitle>
          </DialogHeader>
          <div className="p-4 border-b">
            <Input
              placeholder="Search deals by destination, origin, or airline..."
              value={dealSearch}
              onChange={e => setDealSearch(e.target.value)}
              className="mb-2"
            />
            <div className="flex justify-between items-center text-sm text-slate-500">
              <span>{selectedDeals.length} deals selected</span>
              {selectedDeals.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setSelectedDeals([])} className="h-auto p-0 text-brand-blue">Clear all</Button>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-2">
            {filteredDeals.map((deal: any) => {
              const isSelected = !!selectedDeals.find(d => d.id === deal.id);
              return (
                <div 
                  key={deal.id} 
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${isSelected ? 'border-brand-blue bg-blue-50/50' : 'hover:border-slate-300 hover:bg-slate-50'}`}
                  onClick={() => toggleDeal(deal)}
                >
                  <Checkbox checked={isSelected} className="pointer-events-none" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{deal.destination}</p>
                    <p className="text-xs text-slate-500">{deal.origin || "SLC"} • ${deal.price} • {deal.airlines?.[0]?.name || "Various"}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <DialogFooter className="p-4 border-t bg-white z-10 shrink-0 mt-auto">
            <Button variant="outline" onClick={() => setShowDealPicker(false)}>Cancel</Button>
            <Button onClick={generateSmsText} className="bg-brand-blue hover:bg-brand-blue/90 text-white">
              Insert into Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
