"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Email o password non corretti");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Errore di connessione. Riprova.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-full bg-gold flex items-center justify-center text-black font-semibold text-2xl mx-auto mb-4">
            M
          </div>
          <h1 className="text-3xl font-semibold text-text-primary">
            Monichs Gestionale
          </h1>
          <p className="text-base text-text-secondary mt-2">
            Accedi al gestionale interno
          </p>
        </div>

        {/* Login Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-card rounded-xl border border-border p-8 space-y-6"
        >
          <div className="space-y-2">
            <label className="text-base font-semibold text-text-primary">
              Email
            </label>
            <Input
              type="email"
              placeholder="la-tua-email@monichs.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <label className="text-base font-semibold text-text-primary">
              Password
            </label>
            <Input
              type="password"
              placeholder="La tua password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="bg-danger/10 border border-danger/30 rounded-lg px-4 py-3 text-danger text-base">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={loading}
          >
            {loading ? "Accesso in corso..." : "Accedi"}
          </Button>
        </form>

        <p className="text-center text-sm text-text-muted mt-6">
          Monichs &copy; {new Date().getFullYear()} — Swiss Made Timepieces
        </p>
      </div>
    </div>
  );
}
