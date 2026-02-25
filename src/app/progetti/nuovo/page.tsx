"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import AuthLayout from "@/components/layout/AuthLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import Link from "next/link";

type Mode = "choose" | "manual" | "voice" | "review";

interface ReviewTask {
  title: string;
  description: string;
  assigned_to: string;
  assignedToId: string | null;
  assignment_reasoning: string;
  priority: string;
  estimated_days: number;
  category: string;
}

interface ReviewData {
  transcription: string;
  project: {
    name: string;
    description: string;
    totalDurationDays: number;
    suggestedTimeline: string;
    risks: string[];
  };
  tasks: ReviewTask[];
  users: { id: string; name: string; jobTitle: string }[];
}

export default function NuovoProgettoPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [mode, setMode] = useState<Mode>("choose");

  // Manual form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [durationDays, setDurationDays] = useState(30);
  const [manualLoading, setManualLoading] = useState(false);

  // Voice state
  const [isRecording, setIsRecording] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [voiceDuration, setVoiceDuration] = useState(30);
  const [voiceLoading, setVoiceLoading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Review state
  const [reviewData, setReviewData] = useState<ReviewData | null>(null);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualLoading(true);

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + durationDays);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          startDate,
          targetEndDate: endDate.toISOString(),
          totalDurationDays: durationDays,
        }),
      });

      if (res.ok) {
        const project = await res.json();
        addToast("Progetto creato con successo!");
        router.push(`/progetti/${project.id}`);
      } else {
        const data = await res.json();
        addToast(data.error || "Errore nella creazione", "error");
      }
    } catch {
      addToast("Errore di connessione", "error");
    } finally {
      setManualLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const file = new File([blob], "recording.webm", {
          type: "audio/webm",
        });
        setAudioFile(file);
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch {
      addToast(
        "Impossibile accedere al microfono. Verifica i permessi del browser.",
        "error"
      );
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.size <= 25 * 1024 * 1024) {
      setAudioFile(file);
    } else {
      addToast("Il file deve essere un audio di massimo 25MB", "error");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.size <= 25 * 1024 * 1024) {
      setAudioFile(file);
    } else {
      addToast("Il file deve essere un audio di massimo 25MB", "error");
    }
  };

  const handleVoiceSubmit = async () => {
    if (!audioFile) return;
    setVoiceLoading(true);

    try {
      const formData = new FormData();
      formData.append("audio", audioFile);
      formData.append("durationDays", voiceDuration.toString());

      const res = await fetch("/api/projects/from-voice", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setReviewData(data);
        setMode("review");
        addToast("Progetto generato dall'AI! Controlla i dettagli.");
      } else {
        const data = await res.json();
        addToast(data.error || "Errore nell'elaborazione", "error");
      }
    } catch {
      addToast("Errore di connessione", "error");
    } finally {
      setVoiceLoading(false);
    }
  };

  const handleReviewConfirm = async () => {
    if (!reviewData) return;
    setManualLoading(true);

    const startDateObj = new Date();
    const endDate = new Date(startDateObj);
    endDate.setDate(endDate.getDate() + reviewData.project.totalDurationDays);

    try {
      // Create the project
      const projectRes = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: reviewData.project.name,
          description: reviewData.project.description,
          startDate: startDateObj.toISOString(),
          targetEndDate: endDate.toISOString(),
          totalDurationDays: reviewData.project.totalDurationDays,
        }),
      });

      if (!projectRes.ok) throw new Error("Failed to create project");
      const project = await projectRes.json();

      // Create all tasks
      for (const task of reviewData.tasks) {
        await fetch(`/api/projects/${project.id}/tasks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: task.title,
            description: task.description,
            priority: task.priority,
            category: task.category,
            estimatedDays: task.estimated_days,
            assignedToId: task.assignedToId,
            aiReasoning: task.assignment_reasoning,
          }),
        });
      }

      addToast("Progetto creato con successo!");
      router.push(`/progetti/${project.id}`);
    } catch {
      addToast("Errore nella creazione del progetto", "error");
    } finally {
      setManualLoading(false);
    }
  };

  // Choose mode
  if (mode === "choose") {
    return (
      <AuthLayout>
        <h1 className="text-3xl font-semibold text-text-primary mb-8">
          Nuovo Progetto
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
          <Card
            className="cursor-pointer hover:border-gold/50 transition-colors"
            onClick={() => setMode("manual")}
          >
            <CardContent className="text-center py-12">
              <span className="text-5xl mb-4 block">📝</span>
              <h2 className="text-xl font-semibold text-text-primary mb-2">
                Crea manualmente
              </h2>
              <p className="text-base text-text-secondary">
                Inserisci i dettagli del progetto e aggiungi le task una alla
                volta
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:border-gold/50 transition-colors"
            onClick={() => setMode("voice")}
          >
            <CardContent className="text-center py-12">
              <span className="text-5xl mb-4 block">🎤</span>
              <h2 className="text-xl font-semibold text-text-primary mb-2">
                Crea da nota vocale
              </h2>
              <p className="text-base text-text-secondary">
                Registra o carica un audio e l&apos;AI creerà il progetto per te
              </p>
              <Link
                href="/guida#nota-vocale"
                className="inline-flex items-center gap-1 text-sm text-gold mt-2 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                ? Come funziona
              </Link>
            </CardContent>
          </Card>
        </div>
      </AuthLayout>
    );
  }

  // Manual mode
  if (mode === "manual") {
    return (
      <AuthLayout>
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => setMode("choose")}>
            ← Indietro
          </Button>
          <h1 className="text-3xl font-semibold text-text-primary">
            Crea Progetto Manualmente
          </h1>
        </div>

        <Card className="max-w-2xl">
          <CardContent>
            <form onSubmit={handleManualSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-base font-semibold text-text-primary">
                  Nome del Progetto
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Es. Lancio Trilogia Kickstarter"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-base font-semibold text-text-primary">
                  Descrizione
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descrivi brevemente l'obiettivo del progetto..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-base font-semibold text-text-primary">
                    Data di Inizio
                  </label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-base font-semibold text-text-primary">
                    Durata (giorni)
                  </label>
                  <Input
                    type="number"
                    value={durationDays}
                    onChange={(e) =>
                      setDurationDays(parseInt(e.target.value) || 30)
                    }
                    min={1}
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={manualLoading}
              >
                {manualLoading ? "Creazione in corso..." : "Crea Progetto"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </AuthLayout>
    );
  }

  // Voice mode
  if (mode === "voice") {
    return (
      <AuthLayout>
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => setMode("choose")}>
            ← Indietro
          </Button>
          <h1 className="text-3xl font-semibold text-text-primary">
            Crea Progetto da Nota Vocale
          </h1>
          <Link
            href="/guida#nota-vocale"
            className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-text-secondary hover:text-gold hover:border-gold transition-colors"
            title="Come funziona?"
          >
            ?
          </Link>
        </div>

        <Card className="max-w-2xl">
          <CardContent className="space-y-6">
            {/* Duration setting */}
            <div className="space-y-2">
              <label className="text-base font-semibold text-text-primary">
                Durata prevista del progetto (giorni)
              </label>
              <Input
                type="number"
                value={voiceDuration}
                onChange={(e) =>
                  setVoiceDuration(parseInt(e.target.value) || 30)
                }
                min={1}
              />
              <p className="text-sm text-text-secondary">
                L&apos;AI userà questo dato per stimare le deadline delle task
              </p>
            </div>

            {/* Recording */}
            <div className="text-center py-8">
              {!isRecording && !audioFile && (
                <>
                  <button
                    onClick={startRecording}
                    className="w-20 h-20 rounded-full bg-red-600 hover:bg-red-700 transition-colors flex items-center justify-center mx-auto mb-4"
                    title="Clicca per registrare"
                  >
                    <span className="text-white text-3xl">🎤</span>
                  </button>
                  <p className="text-text-secondary mb-6">
                    Clicca per registrare la tua nota vocale
                  </p>
                </>
              )}

              {isRecording && (
                <>
                  <button
                    onClick={stopRecording}
                    className="w-20 h-20 rounded-full bg-red-600 animate-pulse flex items-center justify-center mx-auto mb-4"
                    title="Clicca per fermare"
                  >
                    <span className="text-white text-3xl">⏹</span>
                  </button>
                  <p className="text-red-400 font-semibold mb-6">
                    Registrazione in corso... Clicca per fermare
                  </p>
                </>
              )}

              {audioFile && !isRecording && (
                <div className="bg-card-hover rounded-lg p-4 mb-4">
                  <p className="text-text-primary font-semibold">
                    Audio pronto: {audioFile.name}
                  </p>
                  <p className="text-sm text-text-secondary">
                    {(audioFile.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAudioFile(null)}
                    className="mt-2"
                  >
                    Rimuovi e riprova
                  </Button>
                </div>
              )}
            </div>

            {/* File drop zone */}
            {!audioFile && !isRecording && (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-gold/50 transition-colors"
              >
                <p className="text-text-secondary mb-2">
                  Oppure trascina qui un file audio
                </p>
                <p className="text-sm text-text-muted mb-4">
                  Formati supportati: .webm, .mp3, .m4a, .wav (max 25MB)
                </p>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".webm,.mp3,.m4a,.wav,audio/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button variant="outline" type="button" asChild>
                    <span>Scegli File</span>
                  </Button>
                </label>
              </div>
            )}

            {/* Submit */}
            {audioFile && (
              <Button
                size="lg"
                className="w-full"
                onClick={handleVoiceSubmit}
                disabled={voiceLoading}
              >
                {voiceLoading
                  ? "L'AI sta analizzando... Attendi qualche secondo"
                  : "Invia e Genera Progetto"}
              </Button>
            )}
          </CardContent>
        </Card>
      </AuthLayout>
    );
  }

  // Review mode
  if (mode === "review" && reviewData) {
    return (
      <AuthLayout>
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => setMode("voice")}>
            ← Indietro
          </Button>
          <h1 className="text-3xl font-semibold text-text-primary">
            Anteprima Progetto Generato
          </h1>
        </div>

        {/* Transcription */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Trascrizione della nota vocale</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-text-secondary italic">
              &quot;{reviewData.transcription}&quot;
            </p>
          </CardContent>
        </Card>

        {/* Project Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Dettagli Progetto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-text-secondary">Nome</label>
              <Input
                value={reviewData.project.name}
                onChange={(e) =>
                  setReviewData({
                    ...reviewData,
                    project: { ...reviewData.project, name: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <label className="text-sm text-text-secondary">Descrizione</label>
              <Textarea
                value={reviewData.project.description}
                onChange={(e) =>
                  setReviewData({
                    ...reviewData,
                    project: {
                      ...reviewData.project,
                      description: e.target.value,
                    },
                  })
                }
              />
            </div>
            {reviewData.project.suggestedTimeline && (
              <div>
                <label className="text-sm text-text-secondary">
                  Timeline Suggerita dall&apos;AI
                </label>
                <p className="text-text-primary mt-1">
                  {reviewData.project.suggestedTimeline}
                </p>
              </div>
            )}
            {reviewData.project.risks && reviewData.project.risks.length > 0 && (
              <div>
                <label className="text-sm text-text-secondary">
                  Rischi Identificati
                </label>
                <ul className="list-disc list-inside text-text-primary mt-1 space-y-1">
                  {reviewData.project.risks.map((risk, i) => (
                    <li key={i}>{risk}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tasks */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                Task Generate ({reviewData.tasks.length})
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setReviewData({
                    ...reviewData,
                    tasks: [
                      ...reviewData.tasks,
                      {
                        title: "Nuova Task",
                        description: "",
                        assigned_to: "",
                        assignedToId: null,
                        assignment_reasoning: "",
                        priority: "MEDIUM",
                        estimated_days: 3,
                        category: "admin",
                      },
                    ],
                  })
                }
              >
                + Aggiungi Task
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reviewData.tasks.map((task, index) => (
                <div
                  key={index}
                  className="border border-border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <Input
                        value={task.title}
                        onChange={(e) => {
                          const updated = [...reviewData.tasks];
                          updated[index] = {
                            ...updated[index],
                            title: e.target.value,
                          };
                          setReviewData({ ...reviewData, tasks: updated });
                        }}
                        placeholder="Titolo task"
                      />
                      <Textarea
                        value={task.description}
                        onChange={(e) => {
                          const updated = [...reviewData.tasks];
                          updated[index] = {
                            ...updated[index],
                            description: e.target.value,
                          };
                          setReviewData({ ...reviewData, tasks: updated });
                        }}
                        placeholder="Descrizione"
                        className="min-h-[60px]"
                      />
                      <div className="grid grid-cols-3 gap-3">
                        <Select
                          value={task.assignedToId || ""}
                          onChange={(e) => {
                            const updated = [...reviewData.tasks];
                            updated[index] = {
                              ...updated[index],
                              assignedToId: e.target.value || null,
                            };
                            setReviewData({ ...reviewData, tasks: updated });
                          }}
                          options={[
                            { value: "", label: "Non assegnata" },
                            ...reviewData.users.map((u) => ({
                              value: u.id,
                              label: `${u.name} (${u.jobTitle})`,
                            })),
                          ]}
                        />
                        <Select
                          value={task.priority}
                          onChange={(e) => {
                            const updated = [...reviewData.tasks];
                            updated[index] = {
                              ...updated[index],
                              priority: e.target.value,
                            };
                            setReviewData({ ...reviewData, tasks: updated });
                          }}
                          options={[
                            { value: "CRITICAL", label: "Critica" },
                            { value: "HIGH", label: "Alta" },
                            { value: "MEDIUM", label: "Media" },
                            { value: "LOW", label: "Bassa" },
                          ]}
                        />
                        <Input
                          type="number"
                          value={task.estimated_days}
                          onChange={(e) => {
                            const updated = [...reviewData.tasks];
                            updated[index] = {
                              ...updated[index],
                              estimated_days: parseInt(e.target.value) || 1,
                            };
                            setReviewData({ ...reviewData, tasks: updated });
                          }}
                          min={1}
                          placeholder="Giorni"
                        />
                      </div>
                      {task.assignment_reasoning && (
                        <p className="text-sm text-text-muted italic">
                          Motivazione AI: {task.assignment_reasoning}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-2 text-danger"
                      onClick={() => {
                        const updated = reviewData.tasks.filter(
                          (_, i) => i !== index
                        );
                        setReviewData({ ...reviewData, tasks: updated });
                      }}
                    >
                      ✕
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Confirm */}
        <div className="flex gap-4 max-w-2xl">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setMode("voice")}
            className="flex-1"
          >
            Annulla
          </Button>
          <Button
            size="lg"
            onClick={handleReviewConfirm}
            disabled={manualLoading}
            className="flex-1"
          >
            {manualLoading
              ? "Creazione in corso..."
              : "Conferma e Crea Progetto"}
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return null;
}
