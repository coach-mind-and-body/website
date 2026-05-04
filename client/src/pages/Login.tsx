import { useState } from "react";
import { toast } from "sonner";
import { BRAND } from "../../../shared/brand";
import { Mail, CheckCircle2, Loader2 } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        throw new Error("Failed to send magic link");
      }

      setSent(true);
      toast.success("Login link sent to your email!");
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "oklch(0.97 0.008 10)" }}>
      <div className="w-full max-w-md p-8 rounded-2xl shadow-xl border" style={{ background: "oklch(0.99 0.005 10)", borderColor: "oklch(0.90 0.01 160)" }}>
        <div className="text-center mb-8">
          <img src={BRAND.logoUrl} alt={BRAND.name} className="w-16 h-16 mx-auto rounded-full object-cover mb-4" />
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.22 0.02 160)" }}>
            Welcome Back
          </h1>
          <p className="text-sm" style={{ color: "oklch(0.55 0.02 160)" }}>
            Sign in to access your program or the admin dashboard.
          </p>
        </div>

        <div className="space-y-6">
          <a
            href="/api/auth/google/login"
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border transition-all hover:-translate-y-0.5 shadow-sm font-semibold"
            style={{ 
              borderColor: "oklch(0.90 0.01 160)",
              color: "oklch(0.22 0.02 160)",
              background: "white"
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Sign in with Google
          </a>

          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: "oklch(0.90 0.01 160)" }}></div>
            </div>
            <div className="relative px-4 text-xs font-semibold uppercase" style={{ color: "oklch(0.60 0.02 160)", background: "oklch(0.99 0.005 10)" }}>
              Or use Email
            </div>
          </div>

          {sent ? (
            <div className="text-center p-6 rounded-xl border" style={{ background: "oklch(0.97 0.03 150)", borderColor: "oklch(0.90 0.04 150)" }}>
              <CheckCircle2 className="w-8 h-8 mx-auto mb-3" style={{ color: "oklch(0.50 0.12 150)" }} />
              <h3 className="font-bold mb-1" style={{ color: "oklch(0.25 0.04 150)" }}>Check your inbox!</h3>
              <p className="text-sm" style={{ color: "oklch(0.40 0.04 150)" }}>
                We sent a magic link to {email}. Click it to sign in.
              </p>
            </div>
          ) : (
            <form onSubmit={handleMagicLink} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: "oklch(0.40 0.02 160)" }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hello@example.com"
                  className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2"
                  style={{ 
                    borderColor: "oklch(0.90 0.01 160)",
                    backgroundColor: "white",
                  }}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading || !email}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all disabled:opacity-50 hover:opacity-90"
                style={{
                  background: "oklch(0.22 0.02 160)",
                  color: "oklch(0.97 0.008 10)",
                }}
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />}
                Send Magic Link
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
