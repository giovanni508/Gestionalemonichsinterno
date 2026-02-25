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

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        tasks: {
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
                  select: { id: true, title: true },
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
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
                jobTitle: true,
                skills: true,
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

    return NextResponse.json(project);
  } catch (error: any) {
    console.error("[Project GET Error]", error);
    return NextResponse.json(
      { error: "Errore nel recupero del progetto" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
    }

    const body = await req.json();
    const updateData: any = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.health !== undefined) updateData.health = body.health;
    if (body.startDate !== undefined)
      updateData.startDate = new Date(body.startDate);
    if (body.targetEndDate !== undefined)
      updateData.targetEndDate = new Date(body.targetEndDate);
    if (body.totalDurationDays !== undefined)
      updateData.totalDurationDays = body.totalDurationDays;
    if (body.aiAnalysis !== undefined) updateData.aiAnalysis = body.aiAnalysis;

    const project = await prisma.project.update({
      where: { id: params.id },
      data: updateData,
      include: {
        tasks: {
          include: {
            assignedTo: {
              select: { id: true, name: true, avatar: true },
            },
          },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true, jobTitle: true },
            },
          },
        },
      },
    });

    return NextResponse.json(project);
  } catch (error: any) {
    console.error("[Project PUT Error]", error);
    return NextResponse.json(
      { error: "Errore nell'aggiornamento del progetto" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
    }

    await prisma.project.delete({ where: { id: params.id } });

    return NextResponse.json({ message: "Progetto eliminato con successo" });
  } catch (error: any) {
    console.error("[Project DELETE Error]", error);
    return NextResponse.json(
      { error: "Errore nell'eliminazione del progetto" },
      { status: 500 }
    );
  }
}
