import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { callClaude } from "@/lib/ai";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
    }

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        tasks: {
          include: {
            assignedTo: {
              select: { name: true },
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
    const todoTasks = project.tasks.filter(
      (t) => t.status === "TODO" || t.status === "BLOCKED"
    );

    const daysSinceStart = Math.ceil(
      (Date.now() - project.startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const velocity =
      daysSinceStart > 0 ? completedTasks.length / daysSinceStart : 0;

    const systemPrompt = `Analizza lo stato corrente del progetto "${project.name}":

Task completate (${completedTasks.length}):
${completedTasks.map((t) => `- ${t.title} (completata il ${t.completedAt?.toLocaleDateString("it-IT")})`).join("\n") || "Nessuna"}

Task in corso (${inProgressTasks.length}):
${inProgressTasks.map((t) => `- ${t.title} (assegnata a: ${t.assignedTo?.name || "N/A"}, deadline: ${t.deadline?.toLocaleDateString("it-IT") || "N/A"}, iniziata: ${t.startDate?.toLocaleDateString("it-IT") || "N/A"})`).join("\n") || "Nessuna"}

Task non iniziate (${todoTasks.length}):
${todoTasks.map((t) => `- ${t.title} (priorità: ${t.priority}, deadline: ${t.deadline?.toLocaleDateString("it-IT") || "N/A"})`).join("\n") || "Nessuna"}

Velocità media del team: ${velocity.toFixed(2)} task/giorno
Giorni trascorsi: ${daysSinceStart}
Giorni totali previsti: ${project.totalDurationDays}
Data obiettivo: ${project.targetEndDate.toLocaleDateString("it-IT")}

Restituisci SOLO un JSON valido (senza markdown) con questa struttura:
{
  "project_health": "ON_TRACK | AT_RISK | DELAYED",
  "at_risk_tasks": [{"title": "...", "reason": "..."}],
  "delay_predictions": [{"title": "...", "predicted_delay_days": numero, "impact": "..."}],
  "suggestions": ["..."],
  "revised_completion_date": "gg/mm/aaaa",
  "summary": "Breve riassunto dello stato del progetto"
}`;

    const aiResponse = await callClaude(
      systemPrompt,
      "Analizza il progetto e fornisci la tua valutazione.",
      4096
    );

    let analysis;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found");
      }
    } catch {
      return NextResponse.json(
        { error: "Errore nell'analisi AI", rawResponse: aiResponse },
        { status: 500 }
      );
    }

    // Update project with analysis
    await prisma.project.update({
      where: { id: params.id },
      data: {
        aiAnalysis: analysis,
        health: analysis.project_health,
      },
    });

    return NextResponse.json(analysis);
  } catch (error: any) {
    console.error("[Analyze Error]", error);
    return NextResponse.json(
      { error: error.message || "Errore nell'analisi del progetto" },
      { status: 500 }
    );
  }
}
