import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create Admin - Giovanni Giordano
  const adminPassword = await bcrypt.hash("admin123", 12);
  const giovanni = await prisma.user.upsert({
    where: { email: "gio@monichs.com" },
    update: {},
    create: {
      email: "gio@monichs.com",
      password: adminPassword,
      name: "Giovanni Giordano",
      role: "ADMIN",
      jobTitle: "Marketing",
      skills: [
        "strategia",
        "comunicazione",
        "brand positioning",
        "social media",
        "copywriting",
      ],
    },
  });
  console.log("Created admin:", giovanni.name);

  // Create Team Members
  const memberPassword = await bcrypt.hash("member123", 12);

  const filippo = await prisma.user.upsert({
    where: { email: "filippo@monichs.com" },
    update: {},
    create: {
      email: "filippo@monichs.com",
      password: memberPassword,
      name: "Filippo Triberti",
      role: "MEMBER",
      jobTitle: "Rete Commerciale",
      skills: ["vendite", "distribuzione", "retail", "B2B", "wholesale"],
    },
  });
  console.log("Created member:", filippo.name);

  const angelo = await prisma.user.upsert({
    where: { email: "angelo@monichs.com" },
    update: {},
    create: {
      email: "angelo@monichs.com",
      password: memberPassword,
      name: "Angelo Lazar Andrey",
      role: "MEMBER",
      jobTitle: "Prodotto",
      skills: [
        "engineering",
        "produzione",
        "supply chain",
        "QC",
        "prototipazione",
      ],
    },
  });
  console.log("Created member:", angelo.name);

  const rachele = await prisma.user.upsert({
    where: { email: "rachele@monichs.com" },
    update: {},
    create: {
      email: "rachele@monichs.com",
      password: memberPassword,
      name: "Rachele Maglitto",
      role: "MEMBER",
      jobTitle: "Design / Art Direction",
      skills: ["design", "branding", "packaging", "UI/UX", "grafica"],
    },
  });
  console.log("Created member:", rachele.name);

  // Create Example Project
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 60);

  const project = await prisma.project.upsert({
    where: { id: "example-project-kickstarter" },
    update: {},
    create: {
      id: "example-project-kickstarter",
      name: "Lancio Trilogia Kickstarter",
      description:
        "Lancio della trilogia di orologi Celeste, Sunset e Virentia su Kickstarter. Include preparazione campagna, materiali marketing, produzione prototipi e strategia di comunicazione.",
      status: "ACTIVE",
      health: "ON_TRACK",
      startDate,
      targetEndDate: endDate,
      totalDurationDays: 60,
      members: {
        create: [
          { userId: giovanni.id, role: "Project Manager" },
          { userId: filippo.id, role: "Commerciale" },
          { userId: angelo.id, role: "Produzione" },
          { userId: rachele.id, role: "Design Lead" },
        ],
      },
    },
  });
  console.log("Created project:", project.name);

  // Create Example Tasks
  const tasks = [
    {
      title: "Design pagina Kickstarter",
      description:
        "Creare il layout completo della pagina Kickstarter: hero image, sezioni prodotto, specifiche tecniche, reward tiers, FAQ, storia del brand.",
      status: "IN_PROGRESS" as const,
      priority: "CRITICAL" as const,
      category: "design",
      estimatedDays: 10,
      assignedToId: rachele.id,
      aiReasoning:
        "Rachele ha le competenze di design e UI/UX necessarie per la creazione della pagina Kickstarter.",
      startDate: new Date(),
      deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      order: 1,
    },
    {
      title: "Strategia pricing e reward tiers",
      description:
        "Definire la struttura dei prezzi per Early Bird, Standard e Late Backer. Includere bundle per la trilogia e accessori.",
      status: "DONE" as const,
      priority: "HIGH" as const,
      category: "commerciale",
      estimatedDays: 5,
      assignedToId: filippo.id,
      aiReasoning:
        "Filippo ha esperienza in vendite e distribuzione, ideale per definire la strategia di pricing.",
      completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      order: 2,
    },
    {
      title: "Produzione prototipi finali",
      description:
        "Completare i prototipi finali dei tre modelli (Celeste, Sunset, Virentia) con movimento Sellita SW200 elaboré. Verifica QC completa.",
      status: "IN_PROGRESS" as const,
      priority: "CRITICAL" as const,
      category: "produzione",
      estimatedDays: 20,
      assignedToId: angelo.id,
      aiReasoning:
        "Angelo gestisce la supply chain e la produzione, è la persona giusta per i prototipi.",
      startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      order: 3,
    },
    {
      title: "Campagna social media pre-lancio",
      description:
        "Creare e pubblicare contenuti teaser su Instagram, Facebook e TikTok. Obiettivo: creare attesa e raccogliere email per la mailing list pre-lancio.",
      status: "TODO" as const,
      priority: "HIGH" as const,
      category: "marketing",
      estimatedDays: 15,
      assignedToId: giovanni.id,
      aiReasoning:
        "Giovanni gestisce il marketing e la comunicazione del brand.",
      deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      order: 4,
    },
    {
      title: "Video promozionale Kickstarter",
      description:
        "Produrre il video principale della campagna: storia del brand, presentazione degli orologi, dettagli tecnici, call to action.",
      status: "TODO" as const,
      priority: "HIGH" as const,
      category: "marketing",
      estimatedDays: 12,
      assignedToId: rachele.id,
      aiReasoning:
        "Rachele come art director guiderà la direzione visiva del video.",
      deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
      order: 5,
    },
    {
      title: "Setup logistica spedizioni internazionali",
      description:
        "Configurare i partner logistici per le spedizioni internazionali. Definire costi, tempi e paesi coperti. Preparare i documenti doganali per gli orologi Swiss Made.",
      status: "TODO" as const,
      priority: "MEDIUM" as const,
      category: "commerciale",
      estimatedDays: 8,
      assignedToId: filippo.id,
      aiReasoning:
        "Filippo gestisce la distribuzione e ha i contatti con i partner logistici.",
      deadline: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
      order: 6,
    },
  ];

  for (const taskData of tasks) {
    await prisma.task.create({
      data: {
        ...taskData,
        projectId: project.id,
        createdById: giovanni.id,
      },
    });
  }
  console.log(`Created ${tasks.length} tasks`);

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
