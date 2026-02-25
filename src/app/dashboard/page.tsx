"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import AuthLayout from "@/components/layout/AuthLayout";
import OnboardingBanner from "@/components/layout/OnboardingBanner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getStatusLabel,
  getPriorityLabel,
  getPriorityColor,
  getHealthEmoji,
  getHealthLabel,
  getHealthColor,
  formatDateShort,
  isOverdue,
} from "@/lib/utils";

interface Project {
  id: string;
  name: string;
  status: string;
  health: string;
  targetEndDate: string;
  tasks: Task[];
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  deadline: string | null;
  assignedTo: { id: string; name: string; avatar: string | null } | null;
  projectId: string;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const allTasks = projects.flatMap((p) => p.tasks);
  const overdueTasks = allTasks.filter(
    (t) => t.deadline && isOverdue(t.deadline) && t.status !== "DONE"
  );
  const inProgressTasks = allTasks.filter((t) => t.status === "IN_PROGRESS");
  const blockedTasks = allTasks.filter((t) => t.status === "BLOCKED");
  const completedTasks = allTasks.filter((t) => t.status === "DONE");
  const activeProjects = projects.filter(
    (p) => p.status === "ACTIVE" || p.status === "PLANNING"
  );

  const firstName = session?.user?.name?.split(" ")[0] || "Utente";

  return (
    <AuthLayout>
      <OnboardingBanner
        pageKey="dashboard"
        message="Benvenuto nella Dashboard! Qui trovi un riepilogo di tutti i tuoi progetti e task. Clicca sugli elementi per vedere i dettagli."
      />

      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-text-primary">
          Ciao {firstName}, ecco la situazione di oggi
        </h1>
        <p className="text-base text-text-secondary mt-1">
          {new Date().toLocaleDateString("it-IT", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-0">
                <p className="text-sm text-text-secondary">Progetti Attivi</p>
                <p className="text-3xl font-semibold text-text-primary mt-1">
                  {activeProjects.length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-0">
                <p className="text-sm text-text-secondary">Task In Corso</p>
                <p className="text-3xl font-semibold text-gold mt-1">
                  {inProgressTasks.length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-0">
                <p className="text-sm text-text-secondary">Task Completate</p>
                <p className="text-3xl font-semibold text-green-500 mt-1">
                  {completedTasks.length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-0">
                <p className="text-sm text-text-secondary">In Ritardo</p>
                <p className="text-3xl font-semibold text-red-500 mt-1">
                  {overdueTasks.length}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Attention Required */}
          {(overdueTasks.length > 0 || blockedTasks.length > 0) && (
            <Card className="mb-8 border-danger/30">
              <CardHeader>
                <CardTitle className="text-danger">
                  Attenzione Richiesta
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {overdueTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between py-2 px-3 bg-danger/5 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-danger font-semibold">
                          In Ritardo
                        </span>
                        <span className="text-text-primary">{task.title}</span>
                      </div>
                      <span className="text-sm text-text-secondary">
                        {task.assignedTo?.name || "Non assegnata"}
                      </span>
                    </div>
                  ))}
                  {blockedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between py-2 px-3 bg-yellow-500/5 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-yellow-500 font-semibold">
                          Bloccata
                        </span>
                        <span className="text-text-primary">{task.title}</span>
                      </div>
                      <span className="text-sm text-text-secondary">
                        {task.assignedTo?.name || "Non assegnata"}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Projects Overview */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-text-primary">
                Progetti
              </h2>
              {(session?.user as any)?.role === "ADMIN" && (
                <Link
                  href="/progetti/nuovo"
                  className="inline-flex items-center gap-2 bg-gold text-black px-6 py-3 rounded-lg font-semibold hover:bg-gold-light transition-colors min-h-button"
                >
                  + Nuovo Progetto
                </Link>
              )}
            </div>

            {projects.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-text-secondary text-lg">
                    Non hai ancora nessun progetto.
                  </p>
                  {(session?.user as any)?.role === "ADMIN" && (
                    <p className="text-text-muted mt-2">
                      Clicca il bottone qui sopra per crearne uno.
                    </p>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((project) => {
                  const total = project.tasks.length;
                  const done = project.tasks.filter(
                    (t) => t.status === "DONE"
                  ).length;
                  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

                  return (
                    <Link key={project.id} href={`/progetti/${project.id}`}>
                      <Card className="hover:border-gold/50 transition-colors cursor-pointer h-full">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">
                              {project.name}
                            </CardTitle>
                            <span title={getHealthLabel(project.health)}>
                              {getHealthEmoji(project.health)}
                            </span>
                          </div>
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

                          {/* Progress bar */}
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

                          <div className="flex justify-between text-sm text-text-secondary">
                            <span>
                              {done}/{total} task
                            </span>
                            <span>
                              Scadenza:{" "}
                              {formatDateShort(project.targetEndDate)}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Tasks */}
          {inProgressTasks.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-text-primary mb-4">
                Task In Corso
              </h2>
              <div className="space-y-2">
                {inProgressTasks.slice(0, 10).map((task) => (
                  <Card key={task.id} className="py-4">
                    <CardContent className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={
                            task.priority === "CRITICAL"
                              ? "critical"
                              : task.priority === "HIGH"
                                ? "high"
                                : task.priority === "MEDIUM"
                                  ? "medium"
                                  : "low"
                          }
                        >
                          {getPriorityLabel(task.priority)}
                        </Badge>
                        <span className="text-text-primary font-semibold">
                          {task.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-text-secondary">
                          {task.assignedTo?.name || "Non assegnata"}
                        </span>
                        {task.deadline && (
                          <span
                            className={`text-sm ${isOverdue(task.deadline) ? "text-danger font-semibold" : "text-text-secondary"}`}
                          >
                            {formatDateShort(task.deadline)}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </AuthLayout>
  );
}
