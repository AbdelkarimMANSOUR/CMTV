import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const patient = await prisma.patient.upsert({
    where: { id: "seed-patient-1" },
    update: {},
    create: {
      id: "seed-patient-1",
      firstName: "Amine",
      lastName: "Bennani",
      phone: "+212600000000",
      email: "amine@example.com"
    }
  });

  await prisma.appointment.upsert({
    where: { id: "seed-appointment-1" },
    update: {},
    create: {
      id: "seed-appointment-1",
      patientId: patient.id,
      startsAt: new Date(Date.now() + 86400000),
      reason: "Controle annuel"
    }
  });

  await prisma.tvContent.upsert({
    where: { id: "seed-tv-1" },
    update: {},
    create: {
      id: "seed-tv-1",
      screenKey: "salle-attente-1",
      title: "Conseils prevention",
      kind: "image",
      url: "https://images.unsplash.com/photo-1576091160550-2173dba999ef",
      durationSec: 12,
      orderIndex: 1
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
