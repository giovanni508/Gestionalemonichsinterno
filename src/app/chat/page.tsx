"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import AuthLayout from "@/components/layout/AuthLayout";
import OnboardingBanner from "@/components/layout/OnboardingBanner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

interface ChatMsg {
  id: string;
  content: string;
  role: "USER" | "ASSISTANT";
  createdAt: string;
}

interface Project {
  id: string;
  name: string;
}

export default function ChatPage() {
  const { data: session } = useSession();
  const { addToast } = useToast();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [selectedProject]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data.map((p: any) => ({ id: p.id, name: p.name })));
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const projectId = selectedProject || "global";
      const res = await fetch(`/api/chat/${projectId}`);
      if (res.ok) {
        setMessages(await res.json());
      }
    } catch (error) {
      console.error("Error fetching chat history:", error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");

    // Add user message to UI immediately
    const tempUserMsg: ChatMsg = {
      id: Date.now().toString(),
      content: userMessage,
      role: "USER",
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          projectId: selectedProject || null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const aiMsg: ChatMsg = {
          id: (Date.now() + 1).toString(),
          content: data.response,
          role: "ASSISTANT",
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        const data = await res.json();
        addToast(data.error || "Errore nella risposta AI", "error");
      }
    } catch {
      addToast("Errore di connessione", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <OnboardingBanner
        pageKey="chat"
        message="Questa è la Chat AI, il tuo consulente personale. Chiedi qualsiasi cosa sui tuoi progetti!"
      />

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold text-text-primary">Chat AI</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-secondary">Contesto:</span>
          <Select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            options={[
              { value: "", label: "Generale (tutti i progetti)" },
              ...projects.map((p) => ({ value: p.id, label: p.name })),
            ]}
            className="w-64"
          />
        </div>
      </div>

      <Card className="flex flex-col h-[calc(100vh-280px)] min-h-[500px]">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {historyLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-xl text-text-secondary mb-2">
                  Inizia una conversazione
                </p>
                <p className="text-text-muted mb-4">
                  Chiedi qualsiasi cosa sui tuoi progetti!
                </p>
                <div className="space-y-2 text-sm text-text-muted">
                  <p>Esempi:</p>
                  <p className="text-gold">
                    &quot;Quali task sono in ritardo?&quot;
                  </p>
                  <p className="text-gold">
                    &quot;Come posso velocizzare il progetto?&quot;
                  </p>
                  <p className="text-gold">
                    &quot;A chi dovrei assegnare questa attività?&quot;
                  </p>
                </div>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "USER" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === "USER"
                      ? "bg-gold text-black rounded-br-sm"
                      : "bg-card-hover text-text-primary rounded-bl-sm"
                  }`}
                >
                  <p className="text-base whitespace-pre-wrap">{msg.content}</p>
                  <p
                    className={`text-xs mt-1 ${msg.role === "USER" ? "text-black/60" : "text-text-muted"}`}
                  >
                    {new Date(msg.createdAt).toLocaleTimeString("it-IT", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-card-hover rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-text-muted animate-bounce" />
                  <div
                    className="w-2 h-2 rounded-full bg-text-muted animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  />
                  <div
                    className="w-2 h-2 rounded-full bg-text-muted animate-bounce"
                    style={{ animationDelay: "0.4s" }}
                  />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-border p-4">
          <div className="flex gap-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Scrivi un messaggio..."
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={loading}
              className="flex-1"
            />
            <Button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              size="lg"
            >
              Invia Messaggio
            </Button>
          </div>
        </div>
      </Card>
    </AuthLayout>
  );
}
