const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Demo123!', 10);
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: { passwordHash, role: 'ADMIN' },
    create: {
      email: 'admin@example.com',
      name: 'Admin',
      passwordHash,
      role: 'ADMIN',
      isActive: true,
      phone: '123'
    }
  });
  console.log("Admin password updated!");
}
main().catch(console.error).finally(() => prisma.$disconnect());
