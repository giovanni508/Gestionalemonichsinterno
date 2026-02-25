import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const body = await req.json();
    const { status } = body;

    const validStatuses = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "BLOCKED"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Stato non valido" },
        { status: 400 }
      );
    }

    const updateData: any = { status };
    if (status === "DONE") {
      updateData.completedAt = new Date();
    }
    if (status === "IN_PROGRESS" && !updateData.startDate) {
      updateData.startDate = new Date();
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
    console.error("[Task Status Error]", error);
    return NextResponse.json(
      { error: "Errore nell'aggiornamento dello stato" },
      { status: 500 }
    );
  }
}
