import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const body = await req.json();
    const updateData: any = {};

    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.estimatedDays !== undefined) updateData.estimatedDays = body.estimatedDays;
    if (body.assignedToId !== undefined) updateData.assignedToId = body.assignedToId;
    if (body.startDate !== undefined) updateData.startDate = body.startDate ? new Date(body.startDate) : null;
    if (body.deadline !== undefined) updateData.deadline = body.deadline ? new Date(body.deadline) : null;
    if (body.bufferDays !== undefined) updateData.bufferDays = body.bufferDays;
    if (body.order !== undefined) updateData.order = body.order;

    if (body.status === "DONE") {
      updateData.completedAt = new Date();
    }

    const task = await prisma.task.update({
      where: { id: params.id },
      data: updateData,
      include: {
        assignedTo: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    return NextResponse.json(task);
  } catch (error: any) {
    console.error("[Task PUT Error]", error);
    return NextResponse.json(
      { error: "Errore nell'aggiornamento della task" },
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

    await prisma.task.delete({ where: { id: params.id } });

    return NextResponse.json({ message: "Task eliminata con successo" });
  } catch (error: any) {
    console.error("[Task DELETE Error]", error);
    return NextResponse.json(
      { error: "Errore nell'eliminazione della task" },
      { status: 500 }
    );
  }
}
