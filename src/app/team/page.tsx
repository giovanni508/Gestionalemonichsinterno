"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthLayout from "@/components/layout/AuthLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  UserPlus,
  Shield,
  Briefcase,
  Mail,
} from "lucide-react";

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
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [newSkill, setNewSkill] = useState("");
  const [editSkill, setEditSkill] = useState("");
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    jobTitle: "",
    skills: "",
    role: "MEMBER",
  });
  const [editForm, setEditForm] = useState({
    name: "",
    jobTitle: "",
    role: "",
    skills: [] as string[],
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

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      jobTitle: user.jobTitle,
      role: user.role,
      skills: [...user.skills],
    });
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (res.ok) {
        fetchUsers();
        setEditingUser(null);
        addToast("Membro aggiornato con successo!");
      } else {
        const data = await res.json();
        addToast(data.error || "Errore nell'aggiornamento", "error");
      }
    } catch {
      addToast("Errore di connessione", "error");
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUserId) return;
    try {
      const res = await fetch(`/api/users/${deleteUserId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== deleteUserId));
        addToast("Membro rimosso con successo");
      } else {
        const data = await res.json();
        addToast(data.error || "Errore nella rimozione", "error");
      }
    } catch {
      addToast("Errore di connessione", "error");
    }
    setDeleteUserId(null);
  };

  const addSkillToEdit = () => {
    if (editSkill.trim() && !editForm.skills.includes(editSkill.trim())) {
      setEditForm({ ...editForm, skills: [...editForm.skills, editSkill.trim()] });
      setEditSkill("");
    }
  };

  const removeSkillFromEdit = (skill: string) => {
    setEditForm({ ...editForm, skills: editForm.skills.filter((s) => s !== skill) });
  };

  return (
    <AuthLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">
            Gestione Team
          </h1>
          <p className="text-sm text-text-muted mt-1">
            {users.length} membri del team
          </p>
        </div>
        <Button onClick={() => setShowAddUser(true)} className="gap-2">
          <UserPlus size={16} />
          Aggiungi Membro
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
            <Card key={user.id} className="relative group">
              <CardContent className="pt-0">
                {/* Actions */}
                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEditDialog(user)}
                    className="w-8 h-8 rounded-lg bg-card-hover flex items-center justify-center text-text-muted hover:text-gold transition-colors"
                    title="Modifica"
                  >
                    <Pencil size={14} />
                  </button>
                  {user.id !== (session?.user as any)?.id && (
                    <button
                      onClick={() => setDeleteUserId(user.id)}
                      className="w-8 h-8 rounded-lg bg-card-hover flex items-center justify-center text-text-muted hover:text-danger transition-colors"
                      title="Rimuovi"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gold/15 flex items-center justify-center text-gold font-medium text-lg shrink-0">
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-text-primary truncate">
                      {user.name}
                    </h3>
                    <p className="text-xs text-text-muted flex items-center gap-1">
                      <Briefcase size={12} />
                      {user.jobTitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <Badge variant={user.role === "ADMIN" ? "default" : "outline"} className="text-xs">
                    <Shield size={10} className="mr-1" />
                    {user.role === "ADMIN" ? "Admin" : "Membro"}
                  </Badge>
                </div>

                <p className="text-xs text-text-muted flex items-center gap-1 mb-3">
                  <Mail size={12} />
                  {user.email}
                </p>

                {user.skills.length > 0 && (
                  <div>
                    <p className="text-xs text-text-muted mb-1.5">Competenze</p>
                    <div className="flex flex-wrap gap-1">
                      {user.skills.map((skill, i) => (
                        <span
                          key={i}
                          className="text-xs bg-gold/10 text-gold px-2 py-0.5 rounded-full"
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
            <label className="text-sm text-text-secondary">Nome Completo</label>
            <Input
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              placeholder="Es. Mario Rossi"
              required
            />
          </div>
          <div>
            <label className="text-sm text-text-secondary">Email</label>
            <Input
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              placeholder="mario@monichs.com"
              required
            />
          </div>
          <div>
            <label className="text-sm text-text-secondary">Password</label>
            <Input
              type="password"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              placeholder="Password iniziale"
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="text-sm text-text-secondary">Ruolo Aziendale</label>
            <Input
              value={newUser.jobTitle}
              onChange={(e) => setNewUser({ ...newUser, jobTitle: e.target.value })}
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
              onChange={(e) => setNewUser({ ...newUser, skills: e.target.value })}
              placeholder="Es. branding, social media, copywriting"
            />
          </div>
          <div>
            <label className="text-sm text-text-secondary">Ruolo Sistema</label>
            <Select
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              options={[
                { value: "MEMBER", label: "Membro" },
                { value: "ADMIN", label: "Amministratore" },
              ]}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setShowAddUser(false)}>
              Annulla
            </Button>
            <Button type="submit">Aggiungi Membro</Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={!!editingUser} onClose={() => setEditingUser(null)}>
        <DialogTitle>Modifica Membro</DialogTitle>
        {editingUser && (
          <form onSubmit={handleEditUser} className="space-y-4">
            <div>
              <label className="text-sm text-text-secondary">Nome</label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm text-text-secondary">Ruolo Aziendale</label>
              <Input
                value={editForm.jobTitle}
                onChange={(e) => setEditForm({ ...editForm, jobTitle: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm text-text-secondary">Ruolo Sistema</label>
              <Select
                value={editForm.role}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                options={[
                  { value: "MEMBER", label: "Membro" },
                  { value: "ADMIN", label: "Amministratore" },
                ]}
              />
            </div>
            <div>
              <label className="text-sm text-text-secondary mb-2 block">Competenze</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {editForm.skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 text-xs bg-gold/10 text-gold px-2 py-1 rounded-full"
                  >
                    {skill}
                    <button type="button" onClick={() => removeSkillFromEdit(skill)}>
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={editSkill}
                  onChange={(e) => setEditSkill(e.target.value)}
                  placeholder="Nuova competenza"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSkillToEdit();
                    }
                  }}
                />
                <Button type="button" variant="outline" size="sm" onClick={addSkillToEdit}>
                  <Plus size={14} />
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setEditingUser(null)}>
                Annulla
              </Button>
              <Button type="submit">Salva Modifiche</Button>
            </DialogFooter>
          </form>
        )}
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteUserId} onClose={() => setDeleteUserId(null)}>
        <DialogTitle>Rimuovere questo membro?</DialogTitle>
        <p className="text-sm text-text-secondary mb-4">
          Sei sicuro? Il membro verr&agrave; rimosso dal team. Le task gi&agrave; assegnate non verranno modificate.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteUserId(null)}>
            Annulla
          </Button>
          <Button variant="destructive" onClick={handleDeleteUser}>
            Rimuovi Membro
          </Button>
        </DialogFooter>
      </Dialog>
    </AuthLayout>
  );
}
