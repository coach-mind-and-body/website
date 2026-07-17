"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { BRAND } from "@shared/brand";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";

import { useMetaPixel } from "@/hooks/useMetaPixel";
import { getMetaParams, generateMetaEventId } from "@/hooks/useMetaParams";
import { useGoogleAnalytics } from "@/hooks/useGoogleAnalytics";

const formSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  email: z.string().email("Please enter a valid email address"),
});

export default function SnackHackLeadGen() {
  const router = useRouter();
  const subscribeMutation = trpc.leadgen.subscribeSnackHack.useMutation();
  const { trackViewContent, trackLead } = useMetaPixel();
  const ga = useGoogleAnalytics();

  useEffect(() => {
    trackViewContent({
      content_name: "Snack Hack Download",
      content_category: "Lead Generation",
      content_type: "product",
    });
    ga.trackViewContent({ item_name: "Snack Hack Download", item_category: "Lead Generation" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      email: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const eventId = generateMetaEventId();
      const meta = getMetaParams();
      await subscribeMutation.mutateAsync({ ...values, ...meta, eventId });

      // Fire conversion events before navigate
      trackLead({ content_name: "Snack Hack Download", content_category: "Lead Generation" }, eventId);
      ga.trackLead({ category: "Lead Generation", label: "Snack Hack Download" });

      // Immediate upsell / thank-you (restored after Next.js migration drop)
      router.push("/snack-hack-offer");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong. Please try again.");
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7]">
      

      <main className="flex-1 flex flex-col justify-center py-10 md:py-20 px-4 sm:px-6 md:px-12 relative overflow-hidden">
        {/* Background Accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#c9a96e]/10 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#3a5a3a]/5 rounded-full blur-3xl -z-10 -translate-x-1/2 translate-y-1/2"></div>

        <div className="max-w-6xl mx-auto w-full">
          {/* Standalone Logo */}
          <div className="flex justify-center md:justify-start mb-8 md:mb-12">
            <img src="/logo-new.jpg" alt="Mind & Body Reset" className="h-16 object-contain rounded-xl shadow-sm" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-20 items-center">
            
            {/* Left Column: Copy */}
            <div className="max-w-lg mx-auto md:mx-0 text-center md:text-left">
              <div className="inline-block px-4 py-1.5 rounded-full bg-[#f4f8f4] border border-[#c8dcc8] text-[#3a5a3a] text-sm font-semibold tracking-wide uppercase mb-6 shadow-sm">
                Free Download
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-playfair font-bold text-[#3a5a3a] mb-6 leading-tight">
                End the <span className="text-[#c9a96e] italic">"Mental Food Fight"</span> Over Late-Night Snacking
              </h1>
              <p className="text-base sm:text-lg text-gray-700 mb-6 leading-relaxed">
                If you're between 40 and 60, the evening hours can feel like a battleground. <strong>But it’s not a lack of willpower.</strong> Your body is navigating major hormone shifts.
              </p>
              <p className="text-base sm:text-lg text-gray-700 mb-8 leading-relaxed">
                Download the <strong>Midlife Mindset Guide</strong> to discover the biology behind your cravings and learn 7 actionable hacks to find lasting peace with your nighttime habits.
              </p>
              
              <ul className="space-y-4 mb-8 text-left">
                {[
                  "Why the 'willpower' approach actually fuels obsession",
                  "The 3-step 'Check-In' protocol to stop autopilot eating",
                  "How to quiet 'food noise' by building safety in your nervous system",
                ].map((point, idx) => (
                  <li key={idx} className="flex items-start text-gray-700">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#c9a96e] mr-3 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm sm:text-base">{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right Column: Form */}
            <div className="bg-white p-6 sm:p-8 md:p-10 rounded-2xl shadow-xl border border-gray-100 relative max-w-md mx-auto w-full">
              <h3 className="text-xl sm:text-2xl font-playfair font-bold text-[#3a5a3a] mb-2 text-center md:text-left">Get Your Free Guide</h3>
              <p className="text-gray-600 mb-6 sm:mb-8 text-center md:text-left text-sm sm:text-base">Tell us where to send your copy.</p>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder="First Name" className="h-12 bg-gray-50 border-gray-200 text-base" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder="Email Address" type="email" className="h-12 bg-gray-50 border-gray-200 text-base" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full h-12 sm:h-14 text-base font-bold bg-[#c9a96e] hover:bg-[#b09055] text-white rounded-full transition-colors shadow-md mt-2 sm:mt-4"
                    disabled={subscribeMutation.isPending}
                  >
                    {subscribeMutation.isPending ? "Sending..." : "Send Me The Guide"}
                  </Button>
                </form>
              </Form>
              <p className="text-[10px] sm:text-xs text-center text-gray-400 mt-6">
                By signing up, you agree to receive emails from {BRAND.name}. We respect your privacy and will never share your information.
              </p>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

