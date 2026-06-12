"use client";

import { useState } from "react";
import { usePathname, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Loader2, Eye, EyeOff } from "lucide-react";


// Google "G" icon SVG
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.20455C17.64 8.56636 17.5827 7.95273 17.4764 7.36364H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5614V15.8195H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.20455Z" fill="#4285F4"/>
      <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5614C11.2418 14.1014 10.2109 14.4204 9 14.4204C6.65591 14.4204 4.67182 12.8373 3.96409 10.71H0.957275V13.0418C2.43818 15.9832 5.48182 18 9 18Z" fill="#34A853"/>
      <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957275C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957275 13.0418L3.96409 10.71Z" fill="#FBBC05"/>
      <path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335"/>
    </svg>
  );
}

type Mode = "login" | "signup" | "forgot";

export default function Login() {
  
  const router = useRouter();
  const utils = trpc.useUtils();

  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "forgot") {
        const res = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to send reset email");
        setForgotSent(true);
        return;
      }

      const endpoint = mode === "signup" ? "/api/auth/signup" : "/api/auth/login";
      const body = mode === "signup" ? { name, email, password } : { email, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Authentication failed");

      // Invalidate auth cache so useAuth() refreshes
      await utils.auth.me.invalidate();

      if (mode === "signup") {
        toast.success("Account created! Check your email to verify your account.");
      } else {
        toast.success(`Welcome back, ${data.user?.name || email}!`);
      }

      // Redirect admins to /admin, regular users to /portal
      const destination = data.user?.role === "admin" ? "/admin" : "/portal";
      router.push(destination);
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: "oklch(0.985 0.008 75)" }}
    >
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <a href="/" className="inline-block">
            <h1
              className="text-3xl font-bold"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                color: "oklch(0.18 0.025 50)",
              }}
            >
              Mind & Body Reset
            </h1>
          </a>
          <p className="text-sm mt-1" style={{ color: "oklch(0.52 0.035 55)" }}>
            {mode === "login" && "Sign in to your account"}
            {mode === "signup" && "Create your account"}
            {mode === "forgot" && "Reset your password"}
          </p>
        </div>

        <Card className="shadow-lg border-0" style={{ background: "oklch(1 0.004 75)" }}>
          <CardContent className="pt-6 pb-8 px-8">

            {/* Forgot password success state */}
            {mode === "forgot" && forgotSent ? (
              <div className="text-center py-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: "oklch(0.92 0.025 145)", color: "oklch(0.38 0.07 145)" }}
                >
                  ✓
                </div>
                <h3 className="font-semibold mb-2" style={{ color: "oklch(0.18 0.025 50)" }}>
                  Check your email
                </h3>
                <p className="text-sm mb-6" style={{ color: "oklch(0.52 0.035 55)" }}>
                  If an account exists for <strong>{email}</strong>, we've sent a password reset link.
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => { setMode("login"); setForgotSent(false); }}
                >
                  Back to sign in
                </Button>
              </div>
            ) : (
              <>
                {/* Google Sign-In button */}
                {mode !== "forgot" && (
                  <>
                    <Button
                      variant="outline"
                      className="w-full flex items-center gap-3 h-11 bg-white hover:bg-gray-50 border border-gray-200"
                      onClick={handleGoogleLogin}
                      type="button"
                    >
                      <GoogleIcon />
                      <span className="text-sm font-medium text-gray-700">
                        Continue with Google
                      </span>
                    </Button>

                    <div className="flex items-center gap-3 my-5">
                      <Separator className="flex-1" />
                      <span className="text-xs" style={{ color: "oklch(0.65 0.03 55)" }}>or</span>
                      <Separator className="flex-1" />
                    </div>
                  </>
                )}

                {/* Email/password form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {mode === "signup" && (
                    <div className="space-y-1.5">
                      <Label htmlFor="name" className="text-sm font-medium" style={{ color: "oklch(0.35 0.03 55)" }}>
                        Full Name
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Lee Anne Smith"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                        autoComplete="name"
                        className="h-11"
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-sm font-medium" style={{ color: "oklch(0.35 0.03 55)" }}>
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      className="h-11"
                    />
                  </div>

                  {mode !== "forgot" && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="text-sm font-medium" style={{ color: "oklch(0.35 0.03 55)" }}>
                          Password
                        </Label>
                        {mode === "login" && (
                          <button
                            type="button"
                            className="text-xs hover:underline"
                            style={{ color: "oklch(0.45 0.09 10)" }}
                            onClick={() => setMode("forgot")}
                          >
                            Forgot password?
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder={mode === "signup" ? "At least 8 characters" : "••••••••"}
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          required
                          autoComplete={mode === "signup" ? "new-password" : "current-password"}
                          className="h-11 pr-10"
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2"
                          style={{ color: "oklch(0.65 0.03 55)" }}
                          onClick={() => setShowPassword(v => !v)}
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {mode === "signup" && (
                        <p className="text-xs" style={{ color: "oklch(0.65 0.03 55)" }}>
                          Minimum 8 characters
                        </p>
                      )}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-11 font-semibold mt-2"
                    style={{ background: "oklch(0.38 0.09 148)", color: "white" }}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="animate-spin mr-2" size={16} />
                    ) : null}
                    {mode === "login" && "Sign In"}
                    {mode === "signup" && "Create Account"}
                    {mode === "forgot" && "Send Reset Link"}
                  </Button>
                </form>

                {/* Mode switcher */}
                <div className="text-center mt-5 text-sm" style={{ color: "oklch(0.52 0.035 55)" }}>
                  {mode === "login" ? (
                    <>
                      Don't have an account?{" "}
                      <button
                        type="button"
                        className="font-semibold hover:underline"
                        style={{ color: "oklch(0.45 0.09 10)" }}
                        onClick={() => setMode("signup")}
                      >
                        Sign up
                      </button>
                    </>
                  ) : mode === "signup" ? (
                    <>
                      Already have an account?{" "}
                      <button
                        type="button"
                        className="font-semibold hover:underline"
                        style={{ color: "oklch(0.45 0.09 10)" }}
                        onClick={() => setMode("login")}
                      >
                        Sign in
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="font-semibold hover:underline"
                      style={{ color: "oklch(0.45 0.09 10)" }}
                      onClick={() => setMode("login")}
                    >
                      ← Back to sign in
                    </button>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs mt-6" style={{ color: "oklch(0.65 0.03 55)" }}>
          By signing in, you agree to our{" "}
          <a href="/privacy" className="underline hover:opacity-80">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}
