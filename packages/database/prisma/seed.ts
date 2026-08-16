import 'dotenv/config';
import { PrismaClient, Role, PictureBookStatus, WhatsAppMessageStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

if (process.env.NODE_ENV === 'production') {
  throw new Error('Database seeding is disabled in production');
}

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      passwordHash: await bcrypt.hash('Admin123!', 10),
      name: 'System Admin',
      role: Role.ADMIN,
      whatsappNumber: '+1234567890',
      whatsappVerified: true,
    },
  });

  // 3. Guide User (Demo)
  const guide = await prisma.user.upsert({
    where: { email: 'demo-guide@example.com' },
    update: {},
    create: {
      email: 'demo-guide@example.com',
      passwordHash: await bcrypt.hash('Demo123!', 10),
      name: 'Demo Guide',
      role: Role.GUIDE,
      whatsappNumber: '+0987654321',
      whatsappVerified: true,
    },
  });

  const endUser = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      name: 'John Doe',
      email: 'user@example.com',
      phone: '+1555123456',
      passwordHash: await bcrypt.hash('Demo123!', 10),
      role: Role.END_USER,
      referredById: guide.id,
      whatsappNumber: '+1555123456',
      whatsappVerified: true,
    },
  });

  console.log('✅ Users created:', admin.email, guide.email, endUser.email);

  // Products
  const products = [
    {
      title: 'Premium Hardcover Picture Book',
      slug: 'premium-hardcover',
      description: 'A beautifully crafted hardcover picture book.',
      price: 150,
      currency: 'USD',
      images: [],
      createdById: admin.id,
    },
    {
      title: 'Softcover Memory Book',
      slug: 'softcover-memory',
      description: 'A simple softcover memory book.',
      price: 80,
      currency: 'USD',
      images: [],
      createdById: admin.id,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: product as any,
    });
  }
  console.log('✅ Products seeded:', products.length);

  // Picture Books
  let pb1 = await prisma.pictureBook.findFirst({ where: { title: 'John\'s Safari Trip' } });
  if (!pb1) {
    pb1 = await prisma.pictureBook.create({
      data: {
        title: 'John\'s Safari Trip',
        userId: endUser.id,
        status: PictureBookStatus.REQUESTED,
      }
    });
  }

  console.log('✅ Picture Books seeded');

  console.log('');
  console.log('🎉 Seeding complete!');
  console.log('');
  console.log('Demo accounts:');
  console.log('  Admin:  admin@example.com  / Admin123!');
  console.log('  Guide:  guide@example.com  / Demo123!');
  console.log('  User:   user@example.com   / Demo123!');
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
