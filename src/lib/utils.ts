import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateShort(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
  });
}

export function isOverdue(deadline: Date | string): boolean {
  return new Date(deadline) < new Date();
}

export function daysUntil(date: Date | string): number {
  const diff = new Date(date).getTime() - new Date().getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    TODO: "Da Fare",
    IN_PROGRESS: "In Corso",
    IN_REVIEW: "In Revisione",
    DONE: "Completata",
    BLOCKED: "Bloccata",
    PLANNING: "Pianificazione",
    ACTIVE: "Attivo",
    ON_HOLD: "In Pausa",
    COMPLETED: "Completato",
    CANCELLED: "Cancellato",
  };
  return labels[status] || status;
}

export function getPriorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    CRITICAL: "Critica",
    HIGH: "Alta",
    MEDIUM: "Media",
    LOW: "Bassa",
  };
  return labels[priority] || priority;
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    CRITICAL: "bg-red-600 text-white",
    HIGH: "bg-orange-500 text-white",
    MEDIUM: "bg-yellow-500 text-black",
    LOW: "bg-blue-500 text-white",
  };
  return colors[priority] || "bg-gray-500 text-white";
}

export function getHealthColor(health: string): string {
  const colors: Record<string, string> = {
    ON_TRACK: "text-green-500",
    AT_RISK: "text-yellow-500",
    DELAYED: "text-red-500",
  };
  return colors[health] || "text-gray-500";
}

export function getHealthLabel(health: string): string {
  const labels: Record<string, string> = {
    ON_TRACK: "In Regola",
    AT_RISK: "A Rischio",
    DELAYED: "In Ritardo",
  };
  return labels[health] || health;
}

export function getHealthEmoji(health: string): string {
  const emojis: Record<string, string> = {
    ON_TRACK: "🟢",
    AT_RISK: "🟡",
    DELAYED: "🔴",
  };
  return emojis[health] || "⚪";
}
