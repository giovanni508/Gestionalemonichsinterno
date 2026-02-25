"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthLayout from "@/components/layout/AuthLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  jobTitle: string;
  skills: string[];
  avatar: string | null;
}

export default function TeamPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { addToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    jobTitle: "",
    skills: "",
    role: "MEMBER",
  });

  const isAdmin = (session?.user as any)?.role === "ADMIN";

  useEffect(() => {
    if (!isAdmin) {
      router.push("/dashboard");
      return;
    }
    fetchUsers();
  }, [isAdmin, router]);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newUser,
          skills: newUser.skills
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      });

      if (res.ok) {
        fetchUsers();
        setShowAddUser(false);
        setNewUser({
          name: "",
          email: "",
          password: "",
          jobTitle: "",
          skills: "",
          role: "MEMBER",
        });
        addToast("Membro del team aggiunto con successo!");
      } else {
        const data = await res.json();
        addToast(data.error || "Errore nella creazione", "error");
      }
    } catch {
      addToast("Errore di connessione", "error");
    }
  };

  return (
    <AuthLayout>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-semibold text-text-primary">
          Gestione Team
        </h1>
        <Button onClick={() => setShowAddUser(true)}>
          + Aggiungi Membro
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((user) => (
            <Card key={user.id}>
              <CardContent className="pt-0">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-full bg-gold/20 flex items-center justify-center text-gold font-semibold text-xl">
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary">
                      {user.name}
                    </h3>
                    <p className="text-sm text-text-secondary">
                      {user.jobTitle}
                    </p>
                  </div>
                </div>

                <div className="mb-3">
                  <Badge variant={user.role === "ADMIN" ? "default" : "outline"}>
                    {user.role === "ADMIN" ? "Amministratore" : "Membro"}
                  </Badge>
                </div>

                <p className="text-sm text-text-muted mb-2">Email: {user.email}</p>

                {user.skills.length > 0 && (
                  <div>
                    <p className="text-sm text-text-muted mb-1">Competenze:</p>
                    <div className="flex flex-wrap gap-1">
                      {user.skills.map((skill, i) => (
                        <span
                          key={i}
                          className="text-xs bg-card-hover px-2 py-1 rounded-full text-text-secondary"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add User Modal */}
      <Dialog open={showAddUser} onClose={() => setShowAddUser(false)}>
        <DialogTitle>Aggiungi Membro del Team</DialogTitle>
        <form onSubmit={handleAddUser} className="space-y-4">
          <div>
            <label className="text-sm text-text-secondary">
              Nome Completo
            </label>
            <Input
              value={newUser.name}
              onChange={(e) =>
                setNewUser({ ...newUser, name: e.target.value })
              }
              placeholder="Es. Mario Rossi"
              required
            />
          </div>
          <div>
            <label className="text-sm text-text-secondary">Email</label>
            <Input
              type="email"
              value={newUser.email}
              onChange={(e) =>
                setNewUser({ ...newUser, email: e.target.value })
              }
              placeholder="mario@monichs.com"
              required
            />
          </div>
          <div>
            <label className="text-sm text-text-secondary">Password</label>
            <Input
              type="password"
              value={newUser.password}
              onChange={(e) =>
                setNewUser({ ...newUser, password: e.target.value })
              }
              placeholder="Password iniziale"
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="text-sm text-text-secondary">
              Ruolo Aziendale
            </label>
            <Input
              value={newUser.jobTitle}
              onChange={(e) =>
                setNewUser({ ...newUser, jobTitle: e.target.value })
              }
              placeholder="Es. Marketing, Prodotto, Design"
              required
            />
          </div>
          <div>
            <label className="text-sm text-text-secondary">
              Competenze (separate da virgola)
            </label>
            <Input
              value={newUser.skills}
              onChange={(e) =>
                setNewUser({ ...newUser, skills: e.target.value })
              }
              placeholder="Es. branding, social media, copywriting"
            />
          </div>
          <div>
            <label className="text-sm text-text-secondary">Ruolo Sistema</label>
            <Select
              value={newUser.role}
              onChange={(e) =>
                setNewUser({ ...newUser, role: e.target.value })
              }
              options={[
                { value: "MEMBER", label: "Membro" },
                { value: "ADMIN", label: "Amministratore" },
              ]}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => setShowAddUser(false)}
            >
              Annulla
            </Button>
            <Button type="submit">Aggiungi Membro</Button>
          </DialogFooter>
        </form>
      </Dialog>
    </AuthLayout>
  );
}
