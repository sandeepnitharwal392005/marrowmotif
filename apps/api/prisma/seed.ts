import 'dotenv/config';
import { PrismaClient, Role, PictureBookStatus, WhatsAppMessageStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const adminHash = await bcrypt.hash('Admin123!', 12);
  const demoHash = await bcrypt.hash('Demo123!', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@example.com',
      phone: '+1234567890',
      passwordHash: adminHash,
      role: Role.ADMIN,
    },
  });

  const guide1 = await prisma.user.upsert({
    where: { email: 'guide@example.com' },
    update: {},
    create: {
      name: 'Alex Rivera',
      email: 'guide@example.com',
      phone: '+1987654321',
      passwordHash: demoHash,
      role: Role.GUIDE,
    },
  });

  const guide2 = await prisma.user.upsert({
    where: { email: 'guide2@example.com' },
    update: {},
    create: {
      name: 'Maria Santos',
      email: 'guide2@example.com',
      phone: '+1555123456',
      passwordHash: demoHash,
      role: Role.GUIDE,
    },
  });

  const endUser1 = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      name: 'Jordan Smith',
      email: 'user@example.com',
      phone: '+1444567890',
      passwordHash: demoHash,
      role: Role.END_USER,
      referredById: guide1.id,
    },
  });

  console.log('✅ Users seeded');

  // Products
  const products = [
    {
      title: 'The Classic Picture Book',
      slug: 'classic-book',
      description: 'A timeless collection of your favorite moments, elegantly bound in premium linen.',
      price: 95,
      currency: 'USD',
      images: [
        'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=800&q=80',
      ],
      createdById: admin.id,
    },
    {
      title: 'The Premium Picture Book',
      slug: 'premium-book',
      description: 'Our most popular choice. Hardcover, lay-flat pages, and archival-quality paper for stunning color depth.',
      price: 145,
      currency: 'USD',
      images: [
        'https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?w=800&q=80',
      ],
      createdById: admin.id,
    },
    {
      title: 'The Deluxe Edition',
      slug: 'deluxe-book',
      description: 'The ultimate keepsake. Hand-crafted leather binding, embossed title, and premium protective slipcase.',
      price: 210,
      currency: 'USD',
      images: [
        'https://images.unsplash.com/photo-1532153975070-2e9ab71f1b14?w=800&q=80',
      ],
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
  console.log('✅ Products seeded');

  // Picture Books
  const book1 = await prisma.pictureBook.upsert({
    where: { id: 'seed-book-001' },
    update: {},
    create: {
      id: 'seed-book-001',
      userId: endUser1.id,
      title: 'The Smith Family Vacation',
      driveLink: 'https://demo-drive.local/upload/seed-book-001',
      status: PictureBookStatus.PHOTOS_UPLOADED,
    },
  });

  const endUser2 = await prisma.user.upsert({
    where: { email: 'priya.singh@email.com' },
    update: {},
    create: {
      name: 'Priya Singh',
      phone: '+919123456789',
      email: 'priya.singh@email.com',
      passwordHash: demoHash,
      role: Role.END_USER,
      referredById: guide1.id,
    },
  });

  const book2 = await prisma.pictureBook.upsert({
    where: { id: 'seed-book-002' },
    update: {},
    create: {
      id: 'seed-book-002',
      userId: endUser2.id,
      title: 'Honeymoon in Bali',
      driveLink: null,
      status: PictureBookStatus.REQUESTED,
    },
  });

  const endUser3 = await prisma.user.upsert({
    where: { email: 'carlos.mendez@email.com' },
    update: {},
    create: {
      name: 'Carlos Mendez',
      phone: '+525512345678',
      email: 'carlos.mendez@email.com',
      passwordHash: demoHash,
      role: Role.END_USER,
      referredById: guide1.id,
    },
  });

  const book3 = await prisma.pictureBook.upsert({
    where: { id: 'seed-book-003' },
    update: {},
    create: {
      id: 'seed-book-003',
      userId: endUser3.id,
      title: 'Patagonia Expedition',
      driveLink: 'https://demo-drive.local/upload/seed-book-003',
      status: PictureBookStatus.CANCELLED,
    },
  });

  const endUser4 = await prisma.user.upsert({
    where: { email: 'yuki.tanaka@email.com' },
    update: {},
    create: {
      name: 'Yuki Tanaka',
      phone: '+819012345678',
      email: 'yuki.tanaka@email.com',
      passwordHash: demoHash,
      role: Role.END_USER,
      referredById: guide2.id,
    },
  });

  await prisma.pictureBook.upsert({
    where: { id: 'seed-book-004' },
    update: {},
    create: {
      id: 'seed-book-004',
      userId: endUser4.id,
      title: 'Cherry Blossoms 2024',
      driveLink: 'https://demo-drive.local/upload/seed-book-004',
      status: PictureBookStatus.COMPLETED,
    },
  });

  console.log('✅ Picture Books seeded');

  // WhatsApp messages
  await prisma.whatsAppMessage.upsert({
    where: { id: 'seed-wa-001' },
    update: {},
    create: {
      id: 'seed-wa-001',
      pictureBookId: book1.id,
      status: WhatsAppMessageStatus.DELIVERED,
      providerMessageId: 'demo-wa-msg-rahul-001',
      attempts: 1,
      sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
  });

  await prisma.whatsAppMessage.upsert({
    where: { id: 'seed-wa-003' },
    update: {},
    create: {
      id: 'seed-wa-003',
      pictureBookId: book3.id,
      status: WhatsAppMessageStatus.FAILED,
      errorMessage: 'WhatsApp number not registered on WhatsApp',
      attempts: 3,
    },
  });

  // Contact messages
  await prisma.contactMessage.createMany({
    skipDuplicates: true,
    data: [
      { name: 'Sarah Johnson', email: 'sarah@example.com', message: 'Interested in a classic picture book for my wedding photos.' },
    ],
  });

  console.log('✅ Sample messages seeded');

  console.log('\n🎉 Seeding complete!\n');
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
