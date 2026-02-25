import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { callClaude } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
    }

    const body = await req.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId è obbligatorio" },
        { status: 400 }
      );
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: {
          include: {
            assignedTo: { select: { name: true } },
            dependencies: {
              include: {
                dependsOn: { select: { title: true, status: true } },
              },
            },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Progetto non trovato" },
        { status: 404 }
      );
    }

    const completedTasks = project.tasks.filter((t) => t.status === "DONE");
    const inProgressTasks = project.tasks.filter(
      (t) => t.status === "IN_PROGRESS"
    );
    const pendingTasks = project.tasks.filter(
      (t) => t.status === "TODO" || t.status === "BLOCKED"
    );

    const daysSinceStart = Math.ceil(
      (Date.now() - project.startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const velocity =
      daysSinceStart > 0 ? completedTasks.length / daysSinceStart : 0;

    const prompt = `Analizza lo stato corrente del progetto "${project.name}":

Task completate (${completedTasks.length}):
${completedTasks.map((t) => `- ${t.title} (completata il ${t.completedAt?.toLocaleDateString("it-IT") || "N/A"})`).join("\n") || "Nessuna"}

Task in corso (${inProgressTasks.length}):
${inProgressTasks.map((t) => `- ${t.title} (assegnata a: ${t.assignedTo?.name || "N/A"}, deadline: ${t.deadline?.toLocaleDateString("it-IT") || "N/A"}, iniziata: ${t.startDate?.toLocaleDateString("it-IT") || "N/A"})`).join("\n") || "Nessuna"}

Task non iniziate (${pendingTasks.length}):
${pendingTasks.map((t) => `- ${t.title} (priorità: ${t.priority}, deadline prevista: ${t.deadline?.toLocaleDateString("it-IT") || "N/A"}, dipende da: ${t.dependencies.map((d) => d.dependsOn.title).join(", ") || "nessuna"})`).join("\n") || "Nessuna"}

Velocità media del team: ${velocity.toFixed(2)} task/giorno
Giorni trascorsi: ${daysSinceStart} / ${project.totalDurationDays}
Data obiettivo: ${project.targetEndDate.toLocaleDateString("it-IT")}

Identifica:
1. Task a rischio di ritardo e perché
2. Impatto dei ritardi sulle task dipendenti (effetto domino)
3. Suggerimenti per mitigare i ritardi
4. Se il progetto complessivo è a rischio

Restituisci SOLO un JSON valido (senza markdown):
{
  "project_health": "ON_TRACK | AT_RISK | DELAYED",
  "at_risk_tasks": [{"title": "...", "reason": "...", "risk_level": "high | medium | low"}],
  "delay_predictions": [{"title": "...", "predicted_delay_days": numero, "impact": "..."}],
  "suggestions": ["..."],
  "revised_completion_date": "gg/mm/aaaa",
  "summary": "Breve riassunto"
}`;

    const aiResponse = await callClaude(
      "Sei un analista di progetto specializzato nel settore orologiero.",
      prompt,
      4096
    );

    let prediction;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        prediction = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found");
      }
    } catch {
      return NextResponse.json(
        { error: "Errore nell'analisi AI", rawResponse: aiResponse },
        { status: 500 }
      );
    }

    // Update project health
    await prisma.project.update({
      where: { id: projectId },
      data: {
        health: prediction.project_health,
        aiAnalysis: prediction,
      },
    });

    return NextResponse.json(prediction);
  } catch (error: any) {
    console.error("[Predict Delays Error]", error);
    return NextResponse.json(
      { error: error.message || "Errore nella previsione dei ritardi" },
      { status: 500 }
    );
  }
}
