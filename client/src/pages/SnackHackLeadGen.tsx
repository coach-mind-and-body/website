import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { BRAND } from "../../../shared/brand";
import { trpc } from "../lib/trpc";
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
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { Helmet } from "react-helmet-async";
import { useMetaPixel } from "../hooks/useMetaPixel";

const formSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  email: z.string().email("Please enter a valid email address"),
});

export default function SnackHackLeadGen() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const subscribeMutation = trpc.leadgen.subscribeSnackHack.useMutation();
  const { trackEvent } = useMetaPixel();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      email: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await subscribeMutation.mutateAsync(values);
      setIsSubmitted(true);
      toast.success("Success! Check your email for your free guide.");
      
      // Fire conversion events
      trackEvent("Lead", { content_name: "Snack Hack Guide" });
      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("event", "generate_lead", {
          event_category: "engagement",
          event_label: "Snack Hack Guide"
        });
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong. Please try again.");
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7]">
      <Helmet>
        <title>Midlife Mindset Guide: Late-Night Snacking | {BRAND.name}</title>
      </Helmet>
      
      <SiteNav />

      <main className="flex-1 flex flex-col justify-center py-20 px-6 md:px-12 relative overflow-hidden">
        {/* Background Accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#c9a96e]/10 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#3a5a3a]/5 rounded-full blur-3xl -z-10 -translate-x-1/2 translate-y-1/2"></div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 items-center">
          
          {/* Left Column: Copy */}
          <div className="max-w-lg">
            <div className="inline-block px-4 py-1.5 rounded-full bg-[#f4f8f4] border border-[#c8dcc8] text-[#3a5a3a] text-sm font-semibold tracking-wide uppercase mb-6 shadow-sm">
              Free Download
            </div>
            <h1 className="text-4xl md:text-5xl font-playfair font-bold text-[#3a5a3a] mb-6 leading-tight">
              End the <span className="text-[#c9a96e] italic">"Mental Food Fight"</span> Over Late-Night Snacking
            </h1>
            <p className="text-lg text-gray-700 mb-6 leading-relaxed">
              If you're between 40 and 60, the evening hours can feel like a battleground. <strong>But it’s not a lack of willpower.</strong> Your body is navigating major hormone shifts.
            </p>
            <p className="text-lg text-gray-700 mb-8 leading-relaxed">
              Download the <strong>Midlife Mindset Guide</strong> to discover the biology behind your cravings and learn 7 actionable hacks to find lasting peace with your nighttime habits.
            </p>
            
            <ul className="space-y-4 mb-8">
              {[
                "Why the 'willpower' approach actually fuels obsession",
                "The 3-step 'Check-In' protocol to stop autopilot eating",
                "How to quiet 'food noise' by building safety in your nervous system",
              ].map((point, idx) => (
                <li key={idx} className="flex items-start text-gray-700">
                  <svg className="w-6 h-6 text-[#c9a96e] mr-3 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right Column: Form */}
          <div className="bg-white p-8 md:p-10 rounded-2xl shadow-xl border border-gray-100 relative">
            {isSubmitted ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-[#f4f8f4] text-[#3a5a3a] rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-playfair font-bold text-[#3a5a3a] mb-4">You're In!</h3>
                <p className="text-gray-600 text-lg">
                  The Midlife Mindset Guide is on its way to your inbox. Check your email in a few minutes!
                </p>
              </div>
            ) : (
              <>
                <h3 className="text-2xl font-playfair font-bold text-[#3a5a3a] mb-2">Get Your Free Guide</h3>
                <p className="text-gray-600 mb-8">Tell us where to send your copy.</p>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="First Name" className="h-12 bg-gray-50 border-gray-200" {...field} />
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
                            <Input placeholder="Email Address" type="email" className="h-12 bg-gray-50 border-gray-200" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full h-14 text-base font-bold bg-[#c9a96e] hover:bg-[#b09055] text-white rounded-full transition-colors shadow-md mt-4"
                      disabled={subscribeMutation.isPending}
                    >
                      {subscribeMutation.isPending ? "Sending..." : "Send Me The Guide"}
                    </Button>
                  </form>
                </Form>
                <p className="text-xs text-center text-gray-400 mt-6">
                  By signing up, you agree to receive emails from {BRAND.name}. We respect your privacy and will never share your information.
                </p>
              </>
            )}
          </div>

        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
