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
  FolderKanban,
  ListTodo,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Plus,
} from "lucide-react";
import {
  getStatusLabel,
  getPriorityLabel,
  getHealthLabel,
  getHealthColor,
  getHealthBgColor,
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

      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-text-primary">
          Ciao {firstName}, ecco la situazione di oggi
        </h1>
        <p className="text-sm text-text-muted mt-1">
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
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gold/10 flex items-center justify-center">
                  <FolderKanban size={18} className="text-gold" />
                </div>
                <div>
                  <p className="text-xs text-text-muted">Progetti Attivi</p>
                  <p className="text-xl font-semibold text-text-primary">
                    {activeProjects.length}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <ListTodo size={18} className="text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-text-muted">Task In Corso</p>
                  <p className="text-xl font-semibold text-text-primary">
                    {inProgressTasks.length}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 size={18} className="text-green-500" />
                </div>
                <div>
                  <p className="text-xs text-text-muted">Completate</p>
                  <p className="text-xl font-semibold text-text-primary">
                    {completedTasks.length}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <AlertTriangle size={18} className="text-red-500" />
                </div>
                <div>
                  <p className="text-xs text-text-muted">In Ritardo</p>
                  <p className="text-xl font-semibold text-text-primary">
                    {overdueTasks.length}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {(overdueTasks.length > 0 || blockedTasks.length > 0) && (
            <Card className="mb-8 border-danger/30">
              <CardHeader>
                <CardTitle className="text-danger flex items-center gap-2 text-base">
                  <AlertTriangle size={18} />
                  Attenzione Richiesta
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {overdueTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between py-2 px-3 bg-danger/5 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Clock size={14} className="text-danger shrink-0" />
                        <span className="text-sm text-text-primary">{task.title}</span>
                      </div>
                      <span className="text-xs text-text-muted">
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
                        <AlertTriangle size={14} className="text-yellow-500 shrink-0" />
                        <span className="text-sm text-text-primary">{task.title}</span>
                      </div>
                      <span className="text-xs text-text-muted">
                        {task.assignedTo?.name || "Non assegnata"}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text-primary">Progetti</h2>
              {(session?.user as any)?.role === "ADMIN" && (
                <Link
                  href="/progetti/nuovo"
                  className="inline-flex items-center gap-2 bg-gold text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-gold-light transition-colors"
                >
                  <Plus size={16} />
                  Nuovo Progetto
                </Link>
              )}
            </div>

            {projects.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <FolderKanban size={40} className="mx-auto text-text-muted mb-3" />
                  <p className="text-text-secondary">Non hai ancora nessun progetto.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((project) => {
                  const total = project.tasks.length;
                  const done = project.tasks.filter((t) => t.status === "DONE").length;
                  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

                  return (
                    <Link key={project.id} href={`/progetti/${project.id}`}>
                      <Card className="hover:border-gold/40 transition-all cursor-pointer h-full group">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base group-hover:text-gold transition-colors">
                              {project.name}
                            </CardTitle>
                            <div
                              className={`w-2.5 h-2.5 rounded-full ${getHealthBgColor(project.health)}`}
                              title={getHealthLabel(project.health)}
                            />
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between mb-3">
                            <Badge variant="outline" className="text-xs">
                              {getStatusLabel(project.status)}
                            </Badge>
                            <span className={`text-xs font-medium ${getHealthColor(project.health)}`}>
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
                          <div className="flex justify-between text-xs text-text-muted">
                            <span>{done}/{total} task</span>
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
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

          {inProgressTasks.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-text-primary mb-4">Task In Corso</h2>
              <div className="space-y-2">
                {inProgressTasks.slice(0, 10).map((task) => (
                  <Card key={task.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={
                            task.priority === "CRITICAL" ? "critical" :
                            task.priority === "HIGH" ? "high" :
                            task.priority === "MEDIUM" ? "medium" : "low"
                          }
                          className="text-xs"
                        >
                          {getPriorityLabel(task.priority)}
                        </Badge>
                        <span className="text-sm font-medium text-text-primary">{task.title}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-text-muted">
                          {task.assignedTo?.name || "Non assegnata"}
                        </span>
                        {task.deadline && (
                          <span className={`text-xs ${isOverdue(task.deadline) ? "text-danger font-medium" : "text-text-muted"}`}>
                            {formatDateShort(task.deadline)}
                          </span>
                        )}
                        <ArrowRight size={14} className="text-text-muted" />
                      </div>
                    </div>
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
