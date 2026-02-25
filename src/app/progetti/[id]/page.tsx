"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AuthLayout from "@/components/layout/AuthLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import {
  getStatusLabel,
  getPriorityLabel,
  getPriorityColor,
  getHealthEmoji,
  getHealthLabel,
  getHealthColor,
  formatDate,
  formatDateShort,
  isOverdue,
} from "@/lib/utils";

const KANBAN_COLUMNS = [
  { key: "TODO", label: "Da Fare", color: "border-blue-500" },
  { key: "IN_PROGRESS", label: "In Corso", color: "border-gold" },
  { key: "IN_REVIEW", label: "In Revisione", color: "border-purple-500" },
  { key: "DONE", label: "Completata", color: "border-green-500" },
  { key: "BLOCKED", label: "Bloccata", color: "border-red-500" },
];

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  category: string | null;
  estimatedDays: number | null;
  aiReasoning: string | null;
  deadline: string | null;
  startDate: string | null;
  assignedTo: {
    id: string;
    name: string;
    avatar: string | null;
    jobTitle: string;
  } | null;
  comments: any[];
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  health: string;
  startDate: string;
  targetEndDate: string;
  totalDurationDays: number;
  aiAnalysis: any;
  transcription: string | null;
  tasks: Task[];
  members: any[];
}

export default function ProjectDetailPage() {
  const params = useParams();
  const { data: session } = useSession();
  const { addToast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const isAdmin = (session?.user as any)?.role === "ADMIN";

  // New task form
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    category: "",
    assignedToId: "",
  });

  useEffect(() => {
    fetchProject();
    fetchUsers();
  }, [params.id]);

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/${params.id}`);
      if (res.ok) {
        setProject(await res.json());
      }
    } catch (error) {
      console.error("Error fetching project:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        fetchProject();
        addToast(`Task spostata in "${getStatusLabel(newStatus)}"`);
      }
    } catch {
      addToast("Errore nell'aggiornamento", "error");
    }
  };

  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    e.currentTarget.classList.remove("kanban-drag-over");
    if (draggedTaskId) {
      handleStatusChange(draggedTaskId, status);
      setDraggedTaskId(null);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/projects/${params.id}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask),
      });

      if (res.ok) {
        fetchProject();
        setShowAddTask(false);
        setNewTask({
          title: "",
          description: "",
          priority: "MEDIUM",
          category: "",
          assignedToId: "",
        });
        addToast("Task creata con successo!");
      }
    } catch {
      addToast("Errore nella creazione della task", "error");
    }
  };

  const handleDeleteTask = async () => {
    if (!deleteTaskId) return;
    try {
      const res = await fetch(`/api/tasks/${deleteTaskId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchProject();
        addToast("Task eliminata con successo");
        if (selectedTask?.id === deleteTaskId) setSelectedTask(null);
      }
    } catch {
      addToast("Errore nell'eliminazione", "error");
    }
    setDeleteTaskId(null);
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const res = await fetch(`/api/projects/${params.id}/analyze`, {
        method: "POST",
      });
      if (res.ok) {
        fetchProject();
        addToast("Analisi AI completata!");
      } else {
        const data = await res.json();
        addToast(data.error || "Errore nell'analisi", "error");
      }
    } catch {
      addToast("Errore di connessione", "error");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAddComment = async (taskId: string) => {
    if (!newComment.trim()) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      });
      if (res.ok) {
        setNewComment("");
        fetchProject();
        addToast("Commento aggiunto");
      }
    } catch {
      addToast("Errore nell'aggiunta del commento", "error");
    }
  };

  if (loading) {
    return (
      <AuthLayout>
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-48" />
          <div className="grid grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-96" />
            ))}
          </div>
        </div>
      </AuthLayout>
    );
  }

  if (!project) {
    return (
      <AuthLayout>
        <p className="text-text-secondary text-lg">Progetto non trovato.</p>
      </AuthLayout>
    );
  }

  const total = project.tasks.length;
  const done = project.tasks.filter((t) => t.status === "DONE").length;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <AuthLayout>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-semibold text-text-primary">
              {project.name}
            </h1>
            <span title={getHealthLabel(project.health)} className="text-2xl">
              {getHealthEmoji(project.health)}
            </span>
          </div>
          {project.description && (
            <p className="text-base text-text-secondary mt-1">
              {project.description}
            </p>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          {isAdmin && (
            <>
              <Button
                variant="outline"
                onClick={handleAnalyze}
                disabled={analyzing}
              >
                {analyzing ? "Analisi in corso..." : "Analizza con AI"}
              </Button>
              <Button onClick={() => setShowAddTask(true)}>
                + Aggiungi Task
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Project Info */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-0">
            <p className="text-sm text-text-secondary">Stato</p>
            <Badge variant="outline" className="mt-1">
              {getStatusLabel(project.status)}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-0">
            <p className="text-sm text-text-secondary">Progresso</p>
            <p className="text-2xl font-semibold text-gold mt-1">{percent}%</p>
            <div className="w-full bg-background rounded-full h-2 mt-1">
              <div
                className="bg-gold rounded-full h-2 transition-all"
                style={{ width: `${percent}%` }}
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-0">
            <p className="text-sm text-text-secondary">Scadenza</p>
            <p className="text-lg font-semibold text-text-primary mt-1">
              {formatDate(project.targetEndDate)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-0">
            <p className="text-sm text-text-secondary">Team</p>
            <div className="flex -space-x-2 mt-2">
              {project.members.map((m: any) => (
                <div
                  key={m.id}
                  className="w-8 h-8 rounded-full bg-gold/20 border-2 border-card flex items-center justify-center text-gold text-xs font-semibold"
                  title={m.user.name}
                >
                  {m.user.name
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Analysis */}
      {project.aiAnalysis && (
        <Card className="mb-6 border-gold/30">
          <CardHeader>
            <CardTitle className="text-gold">Analisi AI</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-text-primary mb-3">
              {(project.aiAnalysis as any).summary}
            </p>
            {(project.aiAnalysis as any).suggestions && (
              <div>
                <p className="text-sm font-semibold text-text-secondary mb-2">
                  Suggerimenti:
                </p>
                <ul className="list-disc list-inside text-text-secondary space-y-1">
                  {(project.aiAnalysis as any).suggestions.map(
                    (s: string, i: number) => (
                      <li key={i}>{s}</li>
                    )
                  )}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Kanban Board - Desktop */}
      <div className="hidden lg:grid lg:grid-cols-5 gap-4 mb-6">
        {KANBAN_COLUMNS.map((col) => {
          const tasks = project.tasks.filter((t) => t.status === col.key);
          return (
            <div
              key={col.key}
              className={`rounded-xl border-t-2 ${col.color} bg-card/50 p-3 min-h-[400px]`}
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add("kanban-drag-over");
              }}
              onDragLeave={(e) => {
                e.currentTarget.classList.remove("kanban-drag-over");
              }}
              onDrop={(e) => handleDrop(e, col.key)}
            >
              <h3 className="text-base font-semibold text-text-primary mb-3 px-1">
                {col.label}{" "}
                <span className="text-text-muted">({tasks.length})</span>
              </h3>
              <div className="space-y-2">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => setDraggedTaskId(task.id)}
                    onClick={() => setSelectedTask(task)}
                    className="bg-card border border-border rounded-lg p-3 cursor-pointer hover:border-gold/50 transition-colors"
                  >
                    <p className="text-sm font-semibold text-text-primary mb-2">
                      {task.title}
                    </p>
                    <div className="flex items-center justify-between">
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
                        className="text-xs"
                      >
                        {getPriorityLabel(task.priority)}
                      </Badge>
                      {task.deadline && (
                        <span
                          className={`text-xs ${
                            isOverdue(task.deadline) && task.status !== "DONE"
                              ? "text-danger font-semibold"
                              : "text-text-muted"
                          }`}
                        >
                          {formatDateShort(task.deadline)}
                        </span>
                      )}
                    </div>
                    {task.assignedTo && (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-5 h-5 rounded-full bg-gold/20 flex items-center justify-center text-gold text-[10px] font-semibold">
                          {task.assignedTo.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <span className="text-xs text-text-secondary">
                          {task.assignedTo.name}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile Task List */}
      <div className="lg:hidden space-y-2 mb-6">
        {project.tasks.map((task) => (
          <Card
            key={task.id}
            className="cursor-pointer hover:border-gold/50"
            onClick={() => setSelectedTask(task)}
          >
            <CardContent className="py-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-base font-semibold text-text-primary">
                  {task.title}
                </span>
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
              </div>
              <div className="flex items-center justify-between text-sm text-text-secondary">
                <span>{getStatusLabel(task.status)}</span>
                <span>{task.assignedTo?.name || "Non assegnata"}</span>
              </div>
            </CardContent>
          </Card>
        ))}
        {project.tasks.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-text-secondary">
                Nessuna task ancora. {isAdmin ? "Clicca \"+ Aggiungi Task\" per iniziare." : ""}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Task Detail Modal */}
      <Dialog
        open={!!selectedTask}
        onClose={() => {
          setSelectedTask(null);
          setNewComment("");
        }}
      >
        {selectedTask && (
          <div className="max-h-[80vh] overflow-y-auto">
            <DialogTitle>{selectedTask.title}</DialogTitle>
            {selectedTask.description && (
              <p className="text-text-secondary mb-4">
                {selectedTask.description}
              </p>
            )}

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-text-muted">Stato</p>
                {isAdmin || (session?.user as any)?.id === selectedTask.assignedTo?.id ? (
                  <Select
                    value={selectedTask.status}
                    onChange={(e) => {
                      handleStatusChange(selectedTask.id, e.target.value);
                      setSelectedTask({
                        ...selectedTask,
                        status: e.target.value,
                      });
                    }}
                    options={KANBAN_COLUMNS.map((c) => ({
                      value: c.key,
                      label: c.label,
                    }))}
                  />
                ) : (
                  <Badge variant="outline">
                    {getStatusLabel(selectedTask.status)}
                  </Badge>
                )}
              </div>
              <div>
                <p className="text-sm text-text-muted">Priorità</p>
                <Badge
                  variant={
                    selectedTask.priority === "CRITICAL"
                      ? "critical"
                      : selectedTask.priority === "HIGH"
                        ? "high"
                        : selectedTask.priority === "MEDIUM"
                          ? "medium"
                          : "low"
                  }
                >
                  {getPriorityLabel(selectedTask.priority)}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-text-muted">Assegnata a</p>
                <p className="text-text-primary">
                  {selectedTask.assignedTo?.name || "Non assegnata"}
                </p>
              </div>
              <div>
                <p className="text-sm text-text-muted">Scadenza</p>
                <p
                  className={
                    selectedTask.deadline &&
                    isOverdue(selectedTask.deadline) &&
                    selectedTask.status !== "DONE"
                      ? "text-danger font-semibold"
                      : "text-text-primary"
                  }
                >
                  {selectedTask.deadline
                    ? formatDate(selectedTask.deadline)
                    : "Non impostata"}
                </p>
              </div>
            </div>

            {selectedTask.aiReasoning && (
              <div className="bg-gold/5 border border-gold/20 rounded-lg p-3 mb-4">
                <p className="text-sm text-gold font-semibold mb-1">
                  Motivazione AI
                </p>
                <p className="text-sm text-text-secondary">
                  {selectedTask.aiReasoning}
                </p>
              </div>
            )}

            {/* Comments */}
            <div className="border-t border-border pt-4">
              <h4 className="text-base font-semibold text-text-primary mb-3">
                Commenti
              </h4>
              {selectedTask.comments?.length > 0 ? (
                <div className="space-y-3 mb-4">
                  {selectedTask.comments.map((comment: any) => (
                    <div key={comment.id} className="bg-background rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-text-primary">
                          {comment.author.name}
                        </span>
                        <span className="text-xs text-text-muted">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-text-secondary">
                        {comment.content}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-text-muted mb-4">
                  Nessun commento ancora.
                </p>
              )}
              <div className="flex gap-2">
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Scrivi un commento..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleAddComment(selectedTask.id);
                    }
                  }}
                />
                <Button
                  onClick={() => handleAddComment(selectedTask.id)}
                  size="sm"
                >
                  Invia
                </Button>
              </div>
            </div>

            {/* Delete */}
            {isAdmin && (
              <div className="mt-4 pt-4 border-t border-border">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteTaskId(selectedTask.id)}
                >
                  Elimina Task
                </Button>
              </div>
            )}
          </div>
        )}
      </Dialog>

      {/* Add Task Modal */}
      <Dialog open={showAddTask} onClose={() => setShowAddTask(false)}>
        <DialogTitle>Aggiungi Task</DialogTitle>
        <form onSubmit={handleAddTask} className="space-y-4">
          <div>
            <label className="text-sm text-text-secondary">Titolo</label>
            <Input
              value={newTask.title}
              onChange={(e) =>
                setNewTask({ ...newTask, title: e.target.value })
              }
              placeholder="Titolo della task"
              required
            />
          </div>
          <div>
            <label className="text-sm text-text-secondary">Descrizione</label>
            <Textarea
              value={newTask.description}
              onChange={(e) =>
                setNewTask({ ...newTask, description: e.target.value })
              }
              placeholder="Descrizione..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-text-secondary">Priorità</label>
              <Select
                value={newTask.priority}
                onChange={(e) =>
                  setNewTask({ ...newTask, priority: e.target.value })
                }
                options={[
                  { value: "CRITICAL", label: "Critica" },
                  { value: "HIGH", label: "Alta" },
                  { value: "MEDIUM", label: "Media" },
                  { value: "LOW", label: "Bassa" },
                ]}
              />
            </div>
            <div>
              <label className="text-sm text-text-secondary">
                Assegna a
              </label>
              <Select
                value={newTask.assignedToId}
                onChange={(e) =>
                  setNewTask({ ...newTask, assignedToId: e.target.value })
                }
                options={[
                  { value: "", label: "Non assegnata" },
                  ...users.map((u) => ({
                    value: u.id,
                    label: `${u.name} (${u.jobTitle})`,
                  })),
                ]}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => setShowAddTask(false)}
            >
              Annulla
            </Button>
            <Button type="submit">Crea Task</Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Delete Task Confirmation */}
      <Dialog open={!!deleteTaskId} onClose={() => setDeleteTaskId(null)}>
        <DialogTitle>Eliminare questa task?</DialogTitle>
        <DialogDescription>
          Sei sicuro? Questa azione non può essere annullata.
        </DialogDescription>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteTaskId(null)}>
            Annulla
          </Button>
          <Button variant="destructive" onClick={handleDeleteTask}>
            Elimina Task
          </Button>
        </DialogFooter>
      </Dialog>
    </AuthLayout>
  );
}
