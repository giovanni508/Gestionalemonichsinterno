import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const messages = await prisma.chatMessage.findMany({
      where: {
        projectId: params.projectId === "global" ? null : params.projectId,
        userId,
      },
      include: {
        user: {
          select: { name: true, avatar: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(messages);
  } catch (error: any) {
    console.error("[Chat History Error]", error);
    return NextResponse.json(
      { error: "Errore nel recupero della cronologia chat" },
      { status: 500 }
    );
  }
}
