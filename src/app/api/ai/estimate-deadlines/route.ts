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

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { tasks: true },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Progetto non trovato" },
        { status: 404 }
      );
    }

    const estimates = [];

    for (const task of project.tasks) {
      const systemPrompt = `Sei un consulente di project management specializzato nel settore orologiero e nel lancio di microbrand di lusso.

Task: "${task.title}"
Descrizione: "${task.description || "N/A"}"
Categoria: "${task.category || "N/A"}"
Durata complessiva del progetto: ${project.totalDurationDays} giorni

Considera:
- Tempistiche di mercato per attività simili nel settore orologiero/lusso
- Complessità specifica del settore orologiero
- Che si tratta di un team piccolo (4-10 persone)
- Eventuali dipendenze da fornitori esterni

Restituisci SOLO un JSON valido (senza markdown):
{
  "estimated_days": numero,
  "confidence": "high | medium | low",
  "reasoning": "Spiegazione della stima",
  "external_factors": ["Fattori esterni che possono influenzare"],
  "suggested_buffer_days": numero
}`;

      try {
        const aiResponse = await callClaude(
          systemPrompt,
          "Stima la durata di questa task.",
          2048
        );

        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const estimate = JSON.parse(jsonMatch[0]);

          // Update task with estimate
          await prisma.task.update({
            where: { id: task.id },
            data: {
              estimatedDays: estimate.estimated_days,
              aiConfidence: estimate.confidence,
              aiReasoning: estimate.reasoning,
              bufferDays: estimate.suggested_buffer_days || 0,
            },
          });

          estimates.push({
            taskId: task.id,
            taskTitle: task.title,
            ...estimate,
          });
        }
      } catch (err: any) {
        console.error(`[Estimate Error for task ${task.id}]`, err);
        estimates.push({
          taskId: task.id,
          taskTitle: task.title,
          error: err.message,
        });
      }
    }

    // Calculate deadlines based on dependencies and estimates
    const startDate = project.startDate;
    let currentDate = new Date(startDate);

    for (const task of project.tasks) {
      const estimate = estimates.find((e) => e.taskId === task.id);
      if (estimate && estimate.estimated_days) {
        const taskDeadline = new Date(currentDate);
        taskDeadline.setDate(
          taskDeadline.getDate() +
            estimate.estimated_days +
            (estimate.suggested_buffer_days || 0)
        );

        await prisma.task.update({
          where: { id: task.id },
          data: {
            startDate: new Date(currentDate),
            deadline: taskDeadline,
          },
        });
      }
    }

    return NextResponse.json({ estimates });
  } catch (error: any) {
    console.error("[Estimate Deadlines Error]", error);
    return NextResponse.json(
      { error: error.message || "Errore nella stima delle deadline" },
      { status: 500 }
    );
  }
}
