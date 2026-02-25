import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json(
        { error: "Solo gli amministratori possono registrare nuovi utenti" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { email, password, name, role, jobTitle, skills } = body;

    if (!email || !password || !name || !jobTitle) {
      return NextResponse.json(
        { error: "Tutti i campi obbligatori devono essere compilati" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Un utente con questa email esiste già" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role || "MEMBER",
        jobTitle,
        skills: skills || [],
      },
    });

    return NextResponse.json(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        jobTitle: user.jobTitle,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[Register Error]", error);
    return NextResponse.json(
      { error: "Errore nella registrazione dell'utente" },
      { status: 500 }
    );
  }
}
