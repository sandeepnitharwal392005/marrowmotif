const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

(async () => {
  const adminHash = await bcrypt.hash('Admin123!', 12);
  const demoHash = await bcrypt.hash('Demo123!', 12);
  
  await prisma.user.updateMany({ where: { role: 'ADMIN' }, data: { passwordHash: adminHash, whatsappVerified: true } });
  await prisma.user.updateMany({ where: { role: 'GUIDE' }, data: { passwordHash: demoHash, whatsappVerified: true } });
  await prisma.user.updateMany({ where: { role: 'END_USER' }, data: { passwordHash: demoHash, whatsappVerified: true } });
  
  console.log('Passwords updated');
})().finally(() => prisma.$disconnect());
