import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];
  const name = process.argv[4] || 'User';
  const roleArg = (process.argv[5] || 'END_USER').toUpperCase() as Role;

  const validRoles: Role[] = [Role.ADMIN, Role.GUIDE, Role.END_USER];

  if (!email || !password) {
    console.error('Usage: npm run db:bootstrap-user --workspace=apps/api <email> <password> [name] [ROLE]');
    console.error('Available roles: ADMIN, GUIDE, END_USER');
    process.exit(1);
  }

  if (!validRoles.includes(roleArg)) {
    console.error(`Invalid role "${roleArg}". Valid roles are: ${validRoles.join(', ')}`);
    process.exit(1);
  }

  console.log(`Checking if user ${email} already exists...`);
  const existing = await prisma.user.findUnique({ where: { email } });
  
  if (existing) {
    console.log(`User ${email} already exists. Updating role to ${roleArg}...`);
    await prisma.user.update({
      where: { email },
      data: { role: roleArg }
    });
    console.log('Done updating role.');
    process.exit(0);
  }

  console.log('Hashing password...');
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  console.log(`Creating ${roleArg} user...`);
  await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      role: roleArg,
      isActive: true
    }
  });

  console.log(`${roleArg} user account created successfully.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
