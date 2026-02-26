"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import AuthLayout from "@/components/layout/AuthLayout";
import OnboardingBanner from "@/components/layout/OnboardingBanner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import {
  Plus,
  Trash2,
  FolderKanban,
  Clock,
  ArrowRight,
} from "lucide-react";
import {
  getStatusLabel,
  getHealthLabel,
  getHealthColor,
  getHealthBgColor,
  formatDateShort,
} from "@/lib/utils";

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  health: string;
  startDate: string;
  targetEndDate: string;
  tasks: any[];
  members: any[];
}

export default function ProgettiPage() {
  const { data: session } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { addToast } = useToast();
  const isAdmin = (session?.user as any)?.role === "ADMIN";

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        setProjects(await res.json());
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/projects/${deleteId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== deleteId));
        addToast("Progetto eliminato con successo");
      } else {
        addToast("Errore nell'eliminazione del progetto", "error");
      }
    } catch {
      addToast("Errore di connessione", "error");
    }
    setDeleteId(null);
  };

  return (
    <AuthLayout>
      <OnboardingBanner
        pageKey="progetti"
        message="Qui puoi vedere tutti i tuoi progetti. Clicca su un progetto per vederne i dettagli e gestire le task."
      />

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-text-primary">Progetti</h1>
        {isAdmin && (
          <Link href="/progetti/nuovo">
            <Button className="gap-2">
              <Plus size={16} />
              Nuovo Progetto
            </Button>
          </Link>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16">
            <FolderKanban size={40} className="mx-auto text-text-muted mb-3" />
            <p className="text-text-secondary mb-1">
              Non hai ancora nessun progetto.
            </p>
            {isAdmin && (
              <p className="text-text-muted text-sm">
                Clicca &quot;Nuovo Progetto&quot; per crearne uno.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => {
            const total = project.tasks.length;
            const done = project.tasks.filter(
              (t: any) => t.status === "DONE"
            ).length;
            const percent = total > 0 ? Math.round((done / total) * 100) : 0;

            return (
              <Card
                key={project.id}
                className="hover:border-gold/40 transition-all group"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Link href={`/progetti/${project.id}`}>
                      <CardTitle className="text-base hover:text-gold transition-colors cursor-pointer">
                        {project.name}
                      </CardTitle>
                    </Link>
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${getHealthBgColor(project.health)}`}
                      title={getHealthLabel(project.health)}
                    />
                  </div>
                  {project.description && (
                    <p className="text-xs text-text-muted line-clamp-2">
                      {project.description}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="outline" className="text-xs">
                      {getStatusLabel(project.status)}
                    </Badge>
                    <span
                      className={`text-xs font-medium ${getHealthColor(project.health)}`}
                    >
                      {getHealthLabel(project.health)}
                    </span>
                  </div>

                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-text-muted mb-1.5">
                      <span>Progresso</span>
                      <span>{percent}%</span>
                    </div>
                    <div className="w-full bg-background rounded-full h-1.5">
                      <div
                        className="bg-gold rounded-full h-1.5 transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between text-xs text-text-muted mb-4">
                    <span>{done}/{total} task</span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {formatDateShort(project.startDate)} - {formatDateShort(project.targetEndDate)}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/progetti/${project.id}`} className="flex-1">
                      <Button variant="secondary" className="w-full gap-1" size="sm">
                        Apri
                        <ArrowRight size={14} />
                      </Button>
                    </Link>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(project.id)}
                        className="text-text-muted hover:text-danger"
                      >
                        <Trash2 size={14} />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle>Eliminare questo progetto?</DialogTitle>
        <DialogDescription>
          Sei sicuro? Tutte le task e i dati associati verranno eliminati permanentemente.
        </DialogDescription>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteId(null)}>
            Annulla
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Elimina Progetto
          </Button>
        </DialogFooter>
      </Dialog>
    </AuthLayout>
  );
}
