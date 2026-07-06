"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function ResetPasswordClient() {
  usePageTitle({
    title: "Reset Password | Mind and Body Reset",
    description: "Reset your Mind & Body Reset account password securely.",
    keywords: "reset password, forgot password, account recovery"
  });
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const token = searchParams.get("token") || "";
  const utils = trpc.useUtils();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reset failed");

      await utils.auth.me.invalidate();
      setDone(true);
      toast.success("Password reset! You're now signed in.");
      setTimeout(() => router.push("/portal"), 1500);
    } catch (err: any) {
      toast.error(err.message || "Password reset failed");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "oklch(0.985 0.008 75)" }}>
        <Card className="w-full max-w-md shadow-lg border-0" style={{ background: "oklch(1 0.004 75)" }}>
          <CardContent className="pt-8 pb-8 px-8 text-center">
            <p className="text-sm mb-4" style={{ color: "oklch(0.52 0.035 55)" }}>
              This reset link is invalid or has expired.
            </p>
            <Button variant="outline" onClick={() => router.push("/login")}>Back to sign in</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: "oklch(0.985 0.008 75)" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <a href="/" className="inline-block">
            <h1 className="text-3xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.18 0.025 50)" }}>
              Mind & Body Reset
            </h1>
          </a>
          <p className="text-sm mt-1" style={{ color: "oklch(0.52 0.035 55)" }}>
            Choose a new password
          </p>
        </div>

        <Card className="shadow-lg border-0" style={{ background: "oklch(1 0.004 75)" }}>
          <CardContent className="pt-6 pb-8 px-8">
            {done ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "oklch(0.92 0.025 145)", color: "oklch(0.38 0.07 145)" }}>✓</div>
                <p className="text-sm" style={{ color: "oklch(0.52 0.035 55)" }}>Password updated! Redirecting you...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-sm font-medium" style={{ color: "oklch(0.35 0.03 55)" }}>
                    New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="At least 8 characters"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      autoComplete="new-password"
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
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirm" className="text-sm font-medium" style={{ color: "oklch(0.35 0.03 55)" }}>
                    Confirm Password
                  </Label>
                  <Input
                    id="confirm"
                    type={showPassword ? "text" : "password"}
                    placeholder="Repeat your password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="h-11"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 font-semibold mt-2"
                  style={{ background: "oklch(0.38 0.09 148)", color: "white" }}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                  Reset Password
                </Button>

                <div className="text-center mt-3">
                  <button
                    type="button"
                    className="text-sm hover:underline"
                    style={{ color: "oklch(0.45 0.09 10)" }}
                    onClick={() => router.push("/login")}
                  >
                    ← Back to sign in
                  </button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
