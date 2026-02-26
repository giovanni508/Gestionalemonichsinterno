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
  LayoutGrid,
  List,
  Plus,
  Trash2,
  Brain,
  Clock,
  User as UserIcon,
  ChevronRight,
  GripVertical,
  ArrowUpDown,
} from "lucide-react";
import {
  getStatusLabel,
  getPriorityLabel,
  getHealthLabel,
  getHealthColor,
  getHealthBgColor,
  formatDate,
  formatDateShort,
  isOverdue,
} from "@/lib/utils";

type ViewMode = "board" | "list";

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
  const [viewMode, setViewMode] = useState<ViewMode>("board");
  const [listSort, setListSort] = useState<string>("status");
  const isAdmin = (session?.user as any)?.role === "ADMIN";

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

  const handleAssignmentChange = async (taskId: string, assignedToId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedToId: assignedToId || null }),
      });
      if (res.ok) {
        fetchProject();
        const userName = assignedToId
          ? users.find((u) => u.id === assignedToId)?.name || "utente"
          : "nessuno";
        addToast(`Task assegnata a ${userName}`);
      }
    } catch {
      addToast("Errore nell'assegnazione", "error");
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

  const getSortedTasks = () => {
    if (!project) return [];
    const tasks = [...project.tasks];
    switch (listSort) {
      case "priority": {
        const order: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        return tasks.sort((a, b) => (order[a.priority] ?? 4) - (order[b.priority] ?? 4));
      }
      case "assignee":
        return tasks.sort((a, b) => (a.assignedTo?.name || "ZZZ").localeCompare(b.assignedTo?.name || "ZZZ"));
      case "deadline":
        return tasks.sort((a, b) => {
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        });
      default:
        return tasks.sort((a, b) => {
          const order: Record<string, number> = { TODO: 0, IN_PROGRESS: 1, IN_REVIEW: 2, BLOCKED: 3, DONE: 4 };
          return (order[a.status] ?? 5) - (order[b.status] ?? 5);
        });
    }
  };

  if (loading) {
    return (
      <AuthLayout>
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-24" />
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
        <p className="text-text-secondary">Progetto non trovato.</p>
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
            <h1 className="text-2xl font-semibold text-text-primary">
              {project.name}
            </h1>
            <div
              className={`w-2.5 h-2.5 rounded-full ${getHealthBgColor(project.health)}`}
              title={getHealthLabel(project.health)}
            />
          </div>
          {project.description && (
            <p className="text-sm text-text-muted mt-1">
              {project.description}
            </p>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          {isAdmin && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAnalyze}
                disabled={analyzing}
                className="gap-2"
              >
                <Brain size={16} />
                {analyzing ? "Analisi..." : "Analizza con AI"}
              </Button>
              <Button size="sm" onClick={() => setShowAddTask(true)} className="gap-2">
                <Plus size={16} />
                Aggiungi Task
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Project Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card className="p-4">
          <p className="text-xs text-text-muted">Stato</p>
          <Badge variant="outline" className="mt-1.5 text-xs">
            {getStatusLabel(project.status)}
          </Badge>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-text-muted">Progresso</p>
          <p className="text-xl font-semibold text-gold mt-1">{percent}%</p>
          <div className="w-full bg-background rounded-full h-1.5 mt-1.5">
            <div
              className="bg-gold rounded-full h-1.5 transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-text-muted">Scadenza</p>
          <p className="text-sm font-semibold text-text-primary mt-1.5 flex items-center gap-1">
            <Clock size={14} />
            {formatDate(project.targetEndDate)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-text-muted">Team</p>
          <div className="flex -space-x-2 mt-2">
            {project.members.map((m: any) => (
              <div
                key={m.id}
                className="w-7 h-7 rounded-full bg-gold/15 border-2 border-card flex items-center justify-center text-gold text-[10px] font-medium"
                title={m.user.name}
              >
                {m.user.name.split(" ").map((n: string) => n[0]).join("")}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* AI Analysis */}
      {project.aiAnalysis && (
        <Card className="mb-6 border-gold/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-gold flex items-center gap-2 text-sm">
              <Brain size={16} />
              Analisi AI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-text-primary mb-2">
              {(project.aiAnalysis as any).summary}
            </p>
            {(project.aiAnalysis as any).suggestions && (
              <ul className="list-disc list-inside text-xs text-text-secondary space-y-1">
                {(project.aiAnalysis as any).suggestions.map(
                  (s: string, i: number) => (
                    <li key={i}>{s}</li>
                  )
                )}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {/* View Toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-1">
          <button
            onClick={() => setViewMode("board")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
              viewMode === "board"
                ? "bg-gold/10 text-gold font-medium"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            <LayoutGrid size={15} />
            Bacheca
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
              viewMode === "list"
                ? "bg-gold/10 text-gold font-medium"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            <List size={15} />
            Lista
          </button>
        </div>

        {viewMode === "list" && (
          <div className="flex items-center gap-2">
            <ArrowUpDown size={14} className="text-text-muted" />
            <Select
              value={listSort}
              onChange={(e) => setListSort(e.target.value)}
              options={[
                { value: "status", label: "Stato" },
                { value: "priority", label: "Priorità" },
                { value: "assignee", label: "Assegnatario" },
                { value: "deadline", label: "Scadenza" },
              ]}
              className="w-40 text-sm"
            />
          </div>
        )}
      </div>

      {/* Board View */}
      {viewMode === "board" && (
        <div className="hidden lg:grid lg:grid-cols-5 gap-3 mb-6">
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
                <h3 className="text-sm font-medium text-text-primary mb-3 px-1">
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
                      className="bg-card border border-border rounded-lg p-3 cursor-pointer hover:border-gold/40 transition-colors"
                    >
                      <p className="text-sm font-medium text-text-primary mb-2">
                        {task.title}
                      </p>
                      <div className="flex items-center justify-between">
                        <Badge
                          variant={
                            task.priority === "CRITICAL" ? "critical" :
                            task.priority === "HIGH" ? "high" :
                            task.priority === "MEDIUM" ? "medium" : "low"
                          }
                          className="text-[10px]"
                        >
                          {getPriorityLabel(task.priority)}
                        </Badge>
                        {task.deadline && (
                          <span
                            className={`text-[11px] ${
                              isOverdue(task.deadline) && task.status !== "DONE"
                                ? "text-danger font-medium"
                                : "text-text-muted"
                            }`}
                          >
                            {formatDateShort(task.deadline)}
                          </span>
                        )}
                      </div>
                      {task.assignedTo && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <div className="w-5 h-5 rounded-full bg-gold/15 flex items-center justify-center text-gold text-[9px] font-medium">
                            {task.assignedTo.name.split(" ").map((n) => n[0]).join("")}
                          </div>
                          <span className="text-[11px] text-text-muted">
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
      )}

      {/* List View */}
      {viewMode === "list" && (
        <div className="mb-6">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-card-hover text-xs font-medium text-text-muted border-b border-border">
              <div className="col-span-4">Task</div>
              <div className="col-span-2">Stato</div>
              <div className="col-span-1">Priorit&agrave;</div>
              <div className="col-span-3">Assegnata a</div>
              <div className="col-span-1">Scadenza</div>
              <div className="col-span-1"></div>
            </div>
            {/* Rows */}
            {getSortedTasks().map((task) => (
              <div
                key={task.id}
                className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-border last:border-b-0 hover:bg-card-hover/50 transition-colors items-center"
              >
                <div className="col-span-4">
                  <button
                    onClick={() => setSelectedTask(task)}
                    className="text-sm font-medium text-text-primary hover:text-gold transition-colors text-left"
                  >
                    {task.title}
                  </button>
                </div>
                <div className="col-span-2">
                  {isAdmin ? (
                    <Select
                      value={task.status}
                      onChange={(e) => handleStatusChange(task.id, e.target.value)}
                      options={KANBAN_COLUMNS.map((c) => ({
                        value: c.key,
                        label: c.label,
                      }))}
                      className="text-xs"
                    />
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      {getStatusLabel(task.status)}
                    </Badge>
                  )}
                </div>
                <div className="col-span-1">
                  <Badge
                    variant={
                      task.priority === "CRITICAL" ? "critical" :
                      task.priority === "HIGH" ? "high" :
                      task.priority === "MEDIUM" ? "medium" : "low"
                    }
                    className="text-[10px]"
                  >
                    {getPriorityLabel(task.priority)}
                  </Badge>
                </div>
                <div className="col-span-3">
                  {isAdmin ? (
                    <Select
                      value={task.assignedTo?.id || ""}
                      onChange={(e) => handleAssignmentChange(task.id, e.target.value)}
                      options={[
                        { value: "", label: "Non assegnata" },
                        ...users.map((u) => ({
                          value: u.id,
                          label: `${u.name}`,
                        })),
                      ]}
                      className="text-xs"
                    />
                  ) : (
                    <span className="text-xs text-text-secondary">
                      {task.assignedTo?.name || "Non assegnata"}
                    </span>
                  )}
                </div>
                <div className="col-span-1">
                  {task.deadline ? (
                    <span
                      className={`text-xs ${
                        isOverdue(task.deadline) && task.status !== "DONE"
                          ? "text-danger font-medium"
                          : "text-text-muted"
                      }`}
                    >
                      {formatDateShort(task.deadline)}
                    </span>
                  ) : (
                    <span className="text-xs text-text-muted">-</span>
                  )}
                </div>
                <div className="col-span-1 flex justify-end">
                  <button
                    onClick={() => setSelectedTask(task)}
                    className="text-text-muted hover:text-gold transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            ))}
            {project.tasks.length === 0 && (
              <div className="px-4 py-8 text-center text-text-muted text-sm">
                Nessuna task ancora. {isAdmin ? 'Clicca "Aggiungi Task" per iniziare.' : ""}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile fallback - always show as list on mobile */}
      {viewMode === "board" && (
        <div className="lg:hidden space-y-2 mb-6">
          {project.tasks.map((task) => (
            <Card
              key={task.id}
              className="p-3 cursor-pointer hover:border-gold/40"
              onClick={() => setSelectedTask(task)}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-text-primary">
                  {task.title}
                </span>
                <Badge
                  variant={
                    task.priority === "CRITICAL" ? "critical" :
                    task.priority === "HIGH" ? "high" :
                    task.priority === "MEDIUM" ? "medium" : "low"
                  }
                  className="text-[10px]"
                >
                  {getPriorityLabel(task.priority)}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs text-text-muted">
                <span>{getStatusLabel(task.status)}</span>
                <span>{task.assignedTo?.name || "Non assegnata"}</span>
              </div>
            </Card>
          ))}
          {project.tasks.length === 0 && (
            <Card className="p-6 text-center">
              <p className="text-text-muted text-sm">Nessuna task ancora.</p>
            </Card>
          )}
        </div>
      )}

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
              <p className="text-sm text-text-secondary mb-4">
                {selectedTask.description}
              </p>
            )}

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-text-muted mb-1">Stato</p>
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
                <p className="text-xs text-text-muted mb-1">Priorit&agrave;</p>
                <Badge
                  variant={
                    selectedTask.priority === "CRITICAL" ? "critical" :
                    selectedTask.priority === "HIGH" ? "high" :
                    selectedTask.priority === "MEDIUM" ? "medium" : "low"
                  }
                >
                  {getPriorityLabel(selectedTask.priority)}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1">Assegnata a</p>
                {isAdmin ? (
                  <Select
                    value={selectedTask.assignedTo?.id || ""}
                    onChange={(e) => {
                      handleAssignmentChange(selectedTask.id, e.target.value);
                      const user = users.find((u) => u.id === e.target.value);
                      setSelectedTask({
                        ...selectedTask,
                        assignedTo: user ? { id: user.id, name: user.name, avatar: null, jobTitle: user.jobTitle } : null,
                      });
                    }}
                    options={[
                      { value: "", label: "Non assegnata" },
                      ...users.map((u) => ({
                        value: u.id,
                        label: u.name,
                      })),
                    ]}
                  />
                ) : (
                  <p className="text-sm text-text-primary">
                    {selectedTask.assignedTo?.name || "Non assegnata"}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1">Scadenza</p>
                <p
                  className={`text-sm ${
                    selectedTask.deadline &&
                    isOverdue(selectedTask.deadline) &&
                    selectedTask.status !== "DONE"
                      ? "text-danger font-medium"
                      : "text-text-primary"
                  }`}
                >
                  {selectedTask.deadline
                    ? formatDate(selectedTask.deadline)
                    : "Non impostata"}
                </p>
              </div>
            </div>

            {selectedTask.aiReasoning && (
              <div className="bg-gold/5 border border-gold/20 rounded-lg p-3 mb-4">
                <p className="text-xs text-gold font-medium mb-1 flex items-center gap-1">
                  <Brain size={12} />
                  Motivazione AI
                </p>
                <p className="text-xs text-text-secondary">
                  {selectedTask.aiReasoning}
                </p>
              </div>
            )}

            {/* Comments */}
            <div className="border-t border-border pt-4">
              <h4 className="text-sm font-medium text-text-primary mb-3">
                Commenti
              </h4>
              {selectedTask.comments?.length > 0 ? (
                <div className="space-y-2 mb-4">
                  {selectedTask.comments.map((comment: any) => (
                    <div key={comment.id} className="bg-background rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-text-primary">
                          {comment.author.name}
                        </span>
                        <span className="text-[10px] text-text-muted">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary">
                        {comment.content}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-text-muted mb-4">
                  Nessun commento ancora.
                </p>
              )}
              <div className="flex gap-2">
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Scrivi un commento..."
                  className="text-sm"
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

            {isAdmin && (
              <div className="mt-4 pt-4 border-t border-border">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteTaskId(selectedTask.id)}
                  className="gap-1"
                >
                  <Trash2 size={14} />
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
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              placeholder="Titolo della task"
              required
            />
          </div>
          <div>
            <label className="text-sm text-text-secondary">Descrizione</label>
            <Textarea
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              placeholder="Descrizione..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-text-secondary">Priorit&agrave;</label>
              <Select
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                options={[
                  { value: "CRITICAL", label: "Critica" },
                  { value: "HIGH", label: "Alta" },
                  { value: "MEDIUM", label: "Media" },
                  { value: "LOW", label: "Bassa" },
                ]}
              />
            </div>
            <div>
              <label className="text-sm text-text-secondary">Assegna a</label>
              <Select
                value={newTask.assignedToId}
                onChange={(e) => setNewTask({ ...newTask, assignedToId: e.target.value })}
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
            <Button variant="outline" type="button" onClick={() => setShowAddTask(false)}>
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
          Sei sicuro? Questa azione non pu&ograve; essere annullata.
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
