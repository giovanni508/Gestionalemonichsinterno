import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { callClaude, transcribeAudio } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
    }

    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;
    const durationDays = parseInt(formData.get("durationDays") as string) || 30;

    if (!audioFile) {
      return NextResponse.json(
        { error: "Nessun file audio fornito" },
        { status: 400 }
      );
    }

    // Check file size (25MB max)
    if (audioFile.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Il file audio non può superare i 25MB" },
        { status: 400 }
      );
    }

    // Transcribe audio
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
    const transcription = await transcribeAudio(audioBuffer, audioFile.name);

    // Get team members
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        jobTitle: true,
        skills: true,
        role: true,
      },
    });

    const teamDescription = users
      .map(
        (u) =>
          `- ${u.name} (${u.jobTitle}): competenze: ${u.skills.join(", ")}`
      )
      .join("\n");

    const systemPrompt = `Sei un project manager esperto nel settore orologiero (Swiss Made, microbrand di lusso). Ti viene fornita la trascrizione di una nota vocale dell'amministratore di Monichs.

Il team è composto da:
${teamDescription}

Il progetto ha una durata complessiva stimata di: ${durationDays} giorni.

Analizza la nota vocale e restituisci SOLO un JSON valido (senza markdown, senza \`\`\`) strutturato così:
{
  "project_name": "Nome del progetto",
  "project_description": "Descrizione sintetica",
  "tasks": [
    {
      "title": "Titolo task",
      "description": "Descrizione dettagliata di cosa fare",
      "assigned_to": "nome esatto dell'utente dal team",
      "assignment_reasoning": "Breve motivazione dell'assegnazione",
      "priority": "CRITICAL | HIGH | MEDIUM | LOW",
      "estimated_days": numero,
      "dependencies": ["titolo_task_da_cui_dipende"],
      "category": "design | marketing | produzione | commerciale | admin"
    }
  ],
  "suggested_timeline": "Spiegazione della timeline proposta",
  "risks": ["Lista di potenziali rischi identificati"]
}

Regole:
- Assegna ogni task alla persona più adatta in base a ruolo e competenze
- Se una task è ambigua, assegnala e spiega il ragionamento
- Ordina le task rispettando le dipendenze logiche
- Stima i giorni in modo realistico per un team piccolo
- Identifica task che possono essere parallelizzate
- I valori di priority devono essere esattamente: CRITICAL, HIGH, MEDIUM, o LOW (maiuscolo)`;

    const aiResponse = await callClaude(
      systemPrompt,
      `Trascrizione della nota vocale:\n\n${transcription}`,
      8192
    );

    // Parse the AI response
    let projectData;
    try {
      // Try to extract JSON from response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        projectData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found");
      }
    } catch {
      return NextResponse.json(
        {
          error: "Errore nell'elaborazione della risposta AI. Riprova.",
          rawResponse: aiResponse,
        },
        { status: 500 }
      );
    }

    // Map user names to IDs
    const userMap = new Map(users.map((u) => [u.name.toLowerCase(), u.id]));

    const tasksWithIds = projectData.tasks.map((task: any, index: number) => {
      const assignedName = task.assigned_to?.toLowerCase() || "";
      let assignedToId = null;

      // Try exact match first, then partial match
      for (const [name, id] of userMap) {
        if (
          name === assignedName ||
          name.includes(assignedName) ||
          assignedName.includes(name)
        ) {
          assignedToId = id;
          break;
        }
      }

      // Try matching by first name
      if (!assignedToId) {
        const firstName = assignedName.split(" ")[0];
        for (const [name, id] of userMap) {
          if (name.startsWith(firstName)) {
            assignedToId = id;
            break;
          }
        }
      }

      return {
        ...task,
        assignedToId,
        order: index,
      };
    });

    return NextResponse.json({
      transcription,
      project: {
        name: projectData.project_name,
        description: projectData.project_description,
        totalDurationDays: durationDays,
        suggestedTimeline: projectData.suggested_timeline,
        risks: projectData.risks,
      },
      tasks: tasksWithIds,
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        jobTitle: u.jobTitle,
      })),
    });
  } catch (error: any) {
    console.error("[Voice Project Error]", error);
    return NextResponse.json(
      { error: error.message || "Errore nella creazione del progetto da nota vocale" },
      { status: 500 }
    );
  }
}
