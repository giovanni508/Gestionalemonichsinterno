"use client";

import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import AuthLayout from "@/components/layout/AuthLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { useTheme } from "@/components/ThemeProvider";
import { LogOut, Sun, Moon, Shield } from "lucide-react";

export default function ProfiloPage() {
  const { data: session } = useSession();
  const { addToast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const [name, setName] = useState(session?.user?.name || "");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const body: any = { name };
      if (newPassword) {
        body.password = newPassword;
      }

      const res = await fetch(`/api/users/${(session?.user as any)?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        addToast("Profilo aggiornato con successo!");
        setNewPassword("");
      } else {
        const data = await res.json();
        addToast(data.error || "Errore nell'aggiornamento", "error");
      }
    } catch {
      addToast("Errore di connessione", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthLayout>
      <h1 className="text-2xl font-semibold text-text-primary mb-6">
        Profilo
      </h1>

      <div className="max-w-2xl space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Le tue informazioni</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-gold/15 flex items-center justify-center text-gold font-semibold text-xl">
                {(session?.user?.name || "")
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-text-primary">
                  {session?.user?.name}
                </h2>
                <p className="text-sm text-text-muted">
                  {(session?.user as any)?.jobTitle}
                </p>
                <Badge
                  variant={
                    (session?.user as any)?.role === "ADMIN" ? "default" : "outline"
                  }
                  className="mt-1 text-xs"
                >
                  <Shield size={10} className="mr-1" />
                  {(session?.user as any)?.role === "ADMIN" ? "Admin" : "Membro"}
                </Badge>
              </div>
            </div>
            <p className="text-sm text-text-muted">
              Email: {session?.user?.email}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Modifica Profilo</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-text-primary">
                  Nome
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="border-t border-border pt-4">
                <h3 className="text-sm font-medium text-text-primary mb-3">
                  Cambia Password
                </h3>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Lascia vuoto per non cambiare"
                  minLength={6}
                />
              </div>

              <Button type="submit" disabled={saving}>
                {saving ? "Salvataggio..." : "Salva Modifiche"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Preferenze</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-primary">Tema</p>
                <p className="text-xs text-text-muted">
                  {theme === "dark" ? "Tema scuro attivo" : "Tema chiaro attivo"}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={toggleTheme} className="gap-2">
                {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
                {theme === "dark" ? "Chiaro" : "Scuro"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Button
              variant="destructive"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="gap-2"
            >
              <LogOut size={16} />
              Esci dall&apos;Account
            </Button>
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  );
}
