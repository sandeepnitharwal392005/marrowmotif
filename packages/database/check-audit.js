const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.auditLog.findMany()
  .then(logs => {
    console.log('Audit Logs Count:', logs.length);
    if (logs.length > 0) console.log(logs[0]);
  })
  .finally(() => prisma.$disconnect());
