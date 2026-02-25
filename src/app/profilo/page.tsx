"use client";

import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import AuthLayout from "@/components/layout/AuthLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";

export default function ProfiloPage() {
  const { data: session } = useSession();
  const { addToast } = useToast();
  const [name, setName] = useState(session?.user?.name || "");
  const [currentPassword, setCurrentPassword] = useState("");
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
        setCurrentPassword("");
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
      <h1 className="text-3xl font-semibold text-text-primary mb-8">
        Profilo
      </h1>

      <div className="max-w-2xl space-y-6">
        {/* Profile Info */}
        <Card>
          <CardHeader>
            <CardTitle>Le tue informazioni</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 rounded-full bg-gold/20 flex items-center justify-center text-gold font-semibold text-2xl">
                {(session?.user?.name || "")
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-text-primary">
                  {session?.user?.name}
                </h2>
                <p className="text-text-secondary">
                  {(session?.user as any)?.jobTitle}
                </p>
                <Badge
                  variant={
                    (session?.user as any)?.role === "ADMIN"
                      ? "default"
                      : "outline"
                  }
                  className="mt-1"
                >
                  {(session?.user as any)?.role === "ADMIN"
                    ? "Amministratore"
                    : "Membro"}
                </Badge>
              </div>
            </div>

            <p className="text-text-secondary">
              Email: {session?.user?.email}
            </p>
          </CardContent>
        </Card>

        {/* Edit Profile */}
        <Card>
          <CardHeader>
            <CardTitle>Modifica Profilo</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="text-base font-semibold text-text-primary">
                  Nome
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="border-t border-border pt-4">
                <h3 className="text-base font-semibold text-text-primary mb-3">
                  Cambia Password
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-text-secondary">
                      Nuova Password
                    </label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Lascia vuoto per non cambiare"
                      minLength={6}
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" disabled={saving}>
                {saving ? "Salvataggio..." : "Salva Modifiche"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Logout */}
        <Card>
          <CardContent>
            <Button
              variant="destructive"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              Esci dall&apos;Account
            </Button>
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  );
}
