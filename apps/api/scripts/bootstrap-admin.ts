import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];
  const name = process.argv[4] || 'System Admin';

  if (!email || !password) {
    console.error('Usage: npm run db:bootstrap-admin <email> <password> [name]');
    process.exit(1);
  }

  console.log(`Checking if admin ${email} already exists...`);
  const existing = await prisma.user.findUnique({ where: { email } });
  
  if (existing) {
    console.log(`User ${email} already exists. Updating role to ADMIN...`);
    await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' }
    });
    console.log('Done.');
    process.exit(0);
  }

  console.log('Hashing password...');
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  console.log('Creating admin user...');
  await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      role: 'ADMIN',
      isActive: true,
      whatsappVerified: true
    }
  });

  console.log('Admin account created successfully.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
