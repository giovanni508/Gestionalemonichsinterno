import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const tasks = await prisma.task.findMany({
      where: { projectId: params.id },
      include: {
        assignedTo: {
          select: { id: true, name: true, avatar: true, jobTitle: true },
        },
        createdBy: {
          select: { id: true, name: true },
        },
        dependencies: {
          include: {
            dependsOn: {
              select: { id: true, title: true, status: true },
            },
          },
        },
        comments: {
          include: {
            author: {
              select: { id: true, name: true, avatar: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(tasks);
  } catch (error: any) {
    console.error("[Tasks GET Error]", error);
    return NextResponse.json(
      { error: "Errore nel recupero delle task" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      description,
      priority,
      category,
      estimatedDays,
      assignedToId,
      startDate,
      deadline,
      aiConfidence,
      aiReasoning,
      bufferDays,
    } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Il titolo è obbligatorio" },
        { status: 400 }
      );
    }

    // Get max order for this project
    const maxOrder = await prisma.task.aggregate({
      where: { projectId: params.id },
      _max: { order: true },
    });

    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority: priority || "MEDIUM",
        category,
        estimatedDays,
        assignedToId,
        startDate: startDate ? new Date(startDate) : null,
        deadline: deadline ? new Date(deadline) : null,
        aiConfidence,
        aiReasoning,
        bufferDays: bufferDays || 0,
        order: (maxOrder._max.order || 0) + 1,
        projectId: params.id,
        createdById: (session.user as any).id,
      },
      include: {
        assignedTo: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    // Add assigned user to project members if not already
    if (assignedToId) {
      await prisma.projectMember.upsert({
        where: {
          userId_projectId: {
            userId: assignedToId,
            projectId: params.id,
          },
        },
        update: {},
        create: {
          userId: assignedToId,
          projectId: params.id,
          role: "Membro",
        },
      });
    }

    return NextResponse.json(task, { status: 201 });
  } catch (error: any) {
    console.error("[Task POST Error]", error);
    return NextResponse.json(
      { error: "Errore nella creazione della task" },
      { status: 500 }
    );
  }
}
