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
  getStatusLabel,
  getHealthEmoji,
  getHealthLabel,
  getHealthColor,
  formatDate,
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

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-semibold text-text-primary">Progetti</h1>
        {isAdmin && (
          <Link href="/progetti/nuovo">
            <Button size="lg">+ Nuovo Progetto</Button>
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
            <p className="text-xl text-text-secondary mb-2">
              Non hai ancora nessun progetto.
            </p>
            {isAdmin && (
              <p className="text-text-muted">
                Clicca &quot;+ Nuovo Progetto&quot; per crearne uno.
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
                className="hover:border-gold/50 transition-colors"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Link href={`/progetti/${project.id}`}>
                      <CardTitle className="text-lg hover:text-gold transition-colors cursor-pointer">
                        {project.name}
                      </CardTitle>
                    </Link>
                    <span title={getHealthLabel(project.health)}>
                      {getHealthEmoji(project.health)}
                    </span>
                  </div>
                  {project.description && (
                    <p className="text-sm text-text-secondary line-clamp-2">
                      {project.description}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="outline">
                      {getStatusLabel(project.status)}
                    </Badge>
                    <span
                      className={`text-sm font-semibold ${getHealthColor(project.health)}`}
                    >
                      {getHealthLabel(project.health)}
                    </span>
                  </div>

                  <div className="mb-3">
                    <div className="flex justify-between text-sm text-text-secondary mb-1">
                      <span>Progresso</span>
                      <span>{percent}%</span>
                    </div>
                    <div className="w-full bg-background rounded-full h-2">
                      <div
                        className="bg-gold rounded-full h-2 transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between text-sm text-text-secondary mb-4">
                    <span>{done}/{total} task</span>
                    <span>
                      {formatDateShort(project.startDate)} →{" "}
                      {formatDateShort(project.targetEndDate)}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/progetti/${project.id}`} className="flex-1">
                      <Button variant="secondary" className="w-full" size="sm">
                        Apri Progetto
                      </Button>
                    </Link>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(project.id)}
                        className="text-danger hover:text-danger"
                      >
                        Elimina
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle>Eliminare questo progetto?</DialogTitle>
        <DialogDescription>
          Sei sicuro? Questa azione non può essere annullata. Tutte le task e i
          dati associati verranno eliminati permanentemente.
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
