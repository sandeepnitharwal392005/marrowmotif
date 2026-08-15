import 'dotenv/config';
import { PrismaClient, Role, ClientStatus, WhatsAppMessageStatus } from '@prisma/client';
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

  const seller = await prisma.user.upsert({
    where: { email: 'seller@example.com' },
    update: {},
    create: {
      name: 'Jordan Smith',
      email: 'seller@example.com',
      phone: '+1444567890',
      passwordHash: demoHash,
      role: Role.SELLER,
    },
  });

  console.log('✅ Users created:', admin.email, guide1.email, guide2.email, seller.email);

  // Products
  const products = [
    {
      title: 'Machu Picchu & Sacred Valley Explorer',
      slug: 'machu-picchu-sacred-valley',
      description: 'Discover the magnificent Incan citadel of Machu Picchu and explore the breathtaking Sacred Valley. A carefully crafted journey through ancient ruins, colorful markets, and stunning Andean landscapes.',
      price: 2490,
      currency: 'USD',
      images: [
        'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=1200',
        'https://images.unsplash.com/photo-1580619305218-8423a7ef79b4?w=1200',
        'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=1200',
      ],
      itinerary: [
        { day: 1, title: 'Arrival in Cusco', description: 'Welcome to Cusco! Transfer to hotel and orientation walk. Evening welcome dinner.' },
        { day: 2, title: 'Sacred Valley', description: 'Full-day tour: Pisac ruins and market, Ollantaytambo fortress.' },
        { day: 3, title: 'Machu Picchu', description: 'Train to Aguas Calientes, guided tour of the citadel, return.' },
        { day: 4, title: 'Cusco City Tour', description: 'Sacsayhuamán, Qorikancha, San Blas neighborhood.' },
        { day: 5, title: 'Rainbow Mountain', description: 'Trek to Vinicunca at 5,200m for stunning views.' },
        { day: 6, title: 'Departure', description: 'Breakfast, free morning, transfer to airport.' },
      ],
      highlights: ['Machu Picchu Citadel', 'Sacred Valley', 'Rainbow Mountain', 'Incan Ruins', 'Local Markets'],
      duration: '6 days / 5 nights',
      maxGuests: 12,
      createdById: admin.id,
    },
    {
      title: 'Patagonia End of the World Trek',
      slug: 'patagonia-end-of-world-trek',
      description: 'Embark on an unforgettable adventure through Torres del Paine National Park. Witness massive glaciers, spot condors, and experience the raw wilderness at the southern tip of South America.',
      price: 3850,
      currency: 'USD',
      images: [
        'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1200',
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200',
        'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200',
      ],
      itinerary: [
        { day: 1, title: 'Punta Arenas Arrival', description: 'Transfer to hotel. Briefing and gear check.' },
        { day: 2, title: 'Transfer to Torres del Paine', description: 'Scenic drive. First views of the iconic towers.' },
        { day: 3, title: 'Mirador Las Torres', description: '8-hour hike to the base of the towers.' },
        { day: 4, title: 'Valle del Francés', description: 'Hanging glaciers, condors, and mountain views.' },
        { day: 5, title: 'Grey Glacier', description: 'Boat ride on Lake Grey, glacier moraine walk.' },
        { day: 6, title: 'Lago Nordenskjöld', description: 'Leisurely day along the lake shore.' },
        { day: 7, title: 'Return', description: 'Transfer back, farewell dinner.' },
        { day: 8, title: 'Departure', description: 'Flight home.' },
      ],
      highlights: ['Torres del Paine', 'Grey Glacier', 'Condors', 'Wild Camping', 'Boat Safari'],
      duration: '8 days / 7 nights',
      maxGuests: 8,
      createdById: admin.id,
    },
    {
      title: 'Bali Spiritual & Adventure Journey',
      slug: 'bali-spiritual-adventure',
      description: 'Find your balance in Bali. Meditate at ancient temples, trek through rice terraces, surf legendary waves, and learn traditional cooking. A transformative experience.',
      price: 1890,
      currency: 'USD',
      images: [
        'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200',
        'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=1200',
        'https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?w=1200',
      ],
      itinerary: [
        { day: 1, title: 'Arrival in Ubud', description: 'Check-in to jungle retreat. Evening welcome ceremony.' },
        { day: 2, title: 'Temples & Spirituality', description: 'Tirta Empul springs, Pura Besakih, Kintamani views.' },
        { day: 3, title: 'Rice Terraces & Cooking', description: 'Tegalalang walk, Balinese cooking class.' },
        { day: 4, title: 'Mount Batur Sunrise', description: 'Pre-dawn trek for spectacular sunrise.' },
        { day: 5, title: 'Transfer to Canggu', description: 'Beach time and surf lesson.' },
        { day: 6, title: 'Surf & Culture', description: 'Morning surf, Tanah Lot temple at sunset.' },
        { day: 7, title: 'Departure', description: 'Transfer to airport.' },
      ],
      highlights: ['Rice Terraces', 'Mount Batur Sunrise', 'Temple Ceremonies', 'Surfing', 'Cooking Class'],
      duration: '7 days / 6 nights',
      maxGuests: 10,
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

  // Clients
  const clientsData = [
    {
      guideId: guide1.id, name: 'Rahul Sharma',
      whatsappNumber: '+919876543210', email: 'rahul.sharma@email.com',
      bookingRef: 'TRV-001', driveLink: 'https://demo-drive.local/client/rahul-sharma-trv-001',
      status: ClientStatus.ACTIVE,
    },
    {
      guideId: guide1.id, name: 'Priya Singh',
      whatsappNumber: '+919123456789', email: 'priya.singh@email.com',
      bookingRef: 'TRV-002', driveLink: null, status: ClientStatus.PENDING,
    },
    {
      guideId: guide1.id, name: 'Carlos Mendez',
      whatsappNumber: '+525512345678', email: 'carlos.mendez@email.com',
      bookingRef: 'TRV-003', driveLink: 'https://demo-drive.local/client/carlos-mendez-trv-003',
      status: ClientStatus.FAILED,
    },
    {
      guideId: guide2.id, name: 'Yuki Tanaka',
      whatsappNumber: '+819012345678', email: 'yuki.tanaka@email.com',
      bookingRef: 'TRV-004', driveLink: 'https://demo-drive.local/client/yuki-tanaka-trv-004',
      status: ClientStatus.ACTIVE,
    },
  ];

  const createdClients: any[] = [];
  for (const clientData of clientsData) {
    let c = await prisma.client.findFirst({ where: { bookingRef: clientData.bookingRef } });
    if (!c) c = await prisma.client.create({ data: clientData });
    createdClients.push(c);
  }
  console.log('✅ Clients seeded:', createdClients.length);

  // WhatsApp messages
  const rahul = createdClients.find((c) => c.bookingRef === 'TRV-001');
  const carlos = createdClients.find((c) => c.bookingRef === 'TRV-003');
  const yuki = createdClients.find((c) => c.bookingRef === 'TRV-004');

  if (rahul) {
    await prisma.whatsAppMessage.upsert({
      where: { id: `seed-${rahul.id}` },
      update: {},
      create: {
        id: `seed-${rahul.id}`, clientId: rahul.id,
        status: WhatsAppMessageStatus.DELIVERED,
        providerMessageId: 'mock_wamid_rahul_001', attempts: 1,
        sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
    });
  }
  if (carlos) {
    await prisma.whatsAppMessage.upsert({
      where: { id: `seed-${carlos.id}` },
      update: {},
      create: {
        id: `seed-${carlos.id}`, clientId: carlos.id,
        status: WhatsAppMessageStatus.FAILED,
        errorMessage: 'WhatsApp number not registered', attempts: 3,
      },
    });
  }
  if (yuki) {
    await prisma.whatsAppMessage.upsert({
      where: { id: `seed-${yuki.id}` },
      update: {},
      create: {
        id: `seed-${yuki.id}`, clientId: yuki.id,
        status: WhatsAppMessageStatus.READ,
        providerMessageId: 'mock_wamid_yuki_004', attempts: 1,
        sentAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    });
  }

  await prisma.contactMessage.createMany({
    data: [
      { name: 'Sarah Johnson', email: 'sarah@example.com', message: 'I am interested in the Machu Picchu tour for a group of 4 in October.' },
      { name: 'David Lee', email: 'david.lee@example.com', message: 'Are there family discounts? We are 5 people travelling during school holidays.' },
    ],
    skipDuplicates: true,
  });

  console.log('');
  console.log('🎉 Seeding complete!');
  console.log('');
  console.log('Demo accounts:');
  console.log('  Admin:  admin@example.com  / Admin123!');
  console.log('  Guide:  guide@example.com  / Demo123!');
  console.log('  Guide2: guide2@example.com / Demo123!');
  console.log('  Seller: seller@example.com / Demo123!');
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
