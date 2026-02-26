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

    const isAdmin = (session.user as any).role === "ADMIN";
    const isSelf = (session.user as any).id === params.id;

    if (!isAdmin && !isSelf) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
    }

    const body = await req.json();
    const updateData: any = {};

    if (body.name) updateData.name = body.name;
    if (body.jobTitle && isAdmin) updateData.jobTitle = body.jobTitle;
    if (body.skills && isAdmin) updateData.skills = body.skills;
    if (body.role && isAdmin) updateData.role = body.role;

    if (body.password) {
      const bcrypt = await import("bcryptjs");
      updateData.password = await bcrypt.hash(body.password, 12);
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        jobTitle: true,
        skills: true,
      },
    });

    return NextResponse.json(user);
  } catch (error: any) {
    console.error("[User Update Error]", error);
    return NextResponse.json(
      { error: "Errore nell'aggiornamento dell'utente" },
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

    // Prevent self-deletion
    if ((session.user as any).id === params.id) {
      return NextResponse.json(
        { error: "Non puoi eliminare il tuo stesso account" },
        { status: 400 }
      );
    }

    // Unassign tasks before deleting user
    await prisma.task.updateMany({
      where: { assignedToId: params.id },
      data: { assignedToId: null },
    });

    // Remove from project memberships
    await prisma.projectMember.deleteMany({
      where: { userId: params.id },
    });

    // Delete user comments
    await prisma.comment.deleteMany({
      where: { authorId: params.id },
    });

    // Delete chat messages
    await prisma.chatMessage.deleteMany({
      where: { userId: params.id },
    });

    await prisma.user.delete({ where: { id: params.id } });

    return NextResponse.json({ message: "Utente rimosso con successo" });
  } catch (error: any) {
    console.error("[User Delete Error]", error);
    return NextResponse.json(
      { error: "Errore nella rimozione dell'utente" },
      { status: 500 }
    );
  }
}
