import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const isAdmin = (session.user as any).role === "ADMIN";

    let projects;
    if (isAdmin) {
      projects = await prisma.project.findMany({
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
        orderBy: { updatedAt: "desc" },
      });
    } else {
      projects = await prisma.project.findMany({
        where: {
          OR: [
            { members: { some: { userId } } },
            { tasks: { some: { assignedToId: userId } } },
          ],
        },
        include: {
          tasks: {
            where: { assignedToId: userId },
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
        orderBy: { updatedAt: "desc" },
      });
    }

    return NextResponse.json(projects);
  } catch (error: any) {
    console.error("[Projects GET Error]", error);
    return NextResponse.json(
      { error: "Errore nel recupero dei progetti" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
    }

    const body = await req.json();
    const { name, description, startDate, targetEndDate, totalDurationDays } =
      body;

    if (!name || !startDate || !targetEndDate || !totalDurationDays) {
      return NextResponse.json(
        { error: "Campi obbligatori mancanti" },
        { status: 400 }
      );
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
        startDate: new Date(startDate),
        targetEndDate: new Date(targetEndDate),
        totalDurationDays,
        members: {
          create: {
            userId: (session.user as any).id,
            role: "Amministratore",
          },
        },
      },
      include: {
        tasks: true,
        members: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true, jobTitle: true },
            },
          },
        },
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error: any) {
    console.error("[Projects POST Error]", error);
    return NextResponse.json(
      { error: "Errore nella creazione del progetto" },
      { status: 500 }
    );
  }
}
