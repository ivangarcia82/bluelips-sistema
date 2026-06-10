const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const patient = await prisma.patient.findFirst();
  if (patient) console.log(patient.id);
  else console.log('No patients found');
}
main().catch(console.error).finally(() => prisma.$disconnect());
