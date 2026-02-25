import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { callClaudeChat } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const body = await req.json();
    const { message, projectId } = body;

    if (!message) {
      return NextResponse.json(
        { error: "Il messaggio è obbligatorio" },
        { status: 400 }
      );
    }

    const userId = (session.user as any).id;
    const isAdmin = (session.user as any).role === "ADMIN";

    // Get context data
    let projectsContext = "";
    if (isAdmin) {
      const projects = await prisma.project.findMany({
        include: {
          tasks: {
            include: {
              assignedTo: { select: { name: true } },
            },
          },
        },
      });

      projectsContext = projects
        .map((p) => {
          const completedTasks = p.tasks.filter((t) => t.status === "DONE").length;
          const totalTasks = p.tasks.length;
          return `Progetto "${p.name}" (${p.status}, ${p.health}): ${completedTasks}/${totalTasks} task completate, scadenza: ${p.targetEndDate.toLocaleDateString("it-IT")}
Task: ${p.tasks.map((t) => `${t.title} [${t.status}] → ${t.assignedTo?.name || "N/A"}`).join(", ")}`;
        })
        .join("\n\n");
    } else {
      const tasks = await prisma.task.findMany({
        where: { assignedToId: userId },
        include: {
          project: { select: { name: true } },
        },
      });

      projectsContext = `Le tue task:\n${tasks
        .map(
          (t) =>
            `- "${t.title}" (progetto: ${t.project.name}, stato: ${t.status}, priorità: ${t.priority}, deadline: ${t.deadline?.toLocaleDateString("it-IT") || "N/A"})`
        )
        .join("\n")}`;
    }

    // Get team info
    const team = await prisma.user.findMany({
      select: { name: true, jobTitle: true, skills: true },
    });

    const teamContext = team
      .map((u) => `- ${u.name} (${u.jobTitle}): ${u.skills.join(", ")}`)
      .join("\n");

    // Get chat history
    const history = await prisma.chatMessage.findMany({
      where: projectId ? { projectId, userId } : { userId, projectId: null },
      orderBy: { createdAt: "asc" },
      take: 20,
    });

    const systemPrompt = `Sei l'assistente AI interno di Monichs, un brand di orologi Swiss Made con movimento Sellita SW200 elaboré, attualmente in fase di lancio.

Il tuo ruolo è:
- Consigliare sulla gestione dei progetti in corso
- Suggerire miglioramenti ai processi
- Rispondere a domande sulla pianificazione
- Aiutare a risolvere problemi e colli di bottiglia
- Fornire insights specifici per il settore orologiero e dei microbrand di lusso

Stato attuale dei progetti:
${projectsContext || "Nessun progetto attivo al momento."}

Team:
${teamContext}

Rispondi in italiano, in modo diretto, pratico e orientato all'azione. Sei un consulente senior, non un chatbot generico.`;

    const messages = [
      ...history.map((h) => ({
        role: h.role.toLowerCase() as "user" | "assistant",
        content: h.content,
      })),
      { role: "user" as const, content: message },
    ];

    const aiResponse = await callClaudeChat(systemPrompt, messages);

    // Save messages to database
    await prisma.chatMessage.createMany({
      data: [
        {
          content: message,
          role: "USER",
          projectId: projectId || null,
          userId,
        },
        {
          content: aiResponse,
          role: "ASSISTANT",
          projectId: projectId || null,
          userId,
        },
      ],
    });

    return NextResponse.json({ response: aiResponse });
  } catch (error: any) {
    console.error("[Chat Error]", error);
    return NextResponse.json(
      { error: error.message || "Errore nella chat AI" },
      { status: 500 }
    );
  }
}
