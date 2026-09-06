import 'dotenv/config';
import { Worker, Job, Queue } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { createProviders } from './providers';

const prisma = new PrismaClient();
const { whatsApp, drive, isDemoMode } = createProviders();
const queueConnection = { url: process.env.REDIS_URL || 'redis://localhost:6379' };
const automationQueue = new Queue('google-drive', { connection: queueConnection });

console.log('🔧 Worker starting...');
console.log(`📦 Demo mode: ${isDemoMode ? 'ENABLED' : 'DISABLED'}`);

const worker = new Worker(
  'google-drive',
  async (job: Job) => {
    if (job.name === 'generate-drive-link' || job.name === 'send-welcome-message') {
      return processWelcomeMessage(job);
    }
    if (job.name === 'send-manual-whatsapp') {
      return processManualWhatsApp(job);
    }
  },
  {
    connection: queueConnection,
    concurrency: 5,
  },
);

async function processWelcomeMessage(job: Job) {
  const { pictureBookId, automationJobId } = job.data as { pictureBookId: string, automationJobId?: string };
  console.log(`\n[Worker] 🚀 Processing job ${job.id} for pictureBook ${pictureBookId}`);

  // Load automation job
  let automationJob = null;
  if (automationJobId) {
    automationJob = await prisma.automationJob.findUnique({ where: { id: automationJobId } });
    if (automationJob) {
      await prisma.automationJob.update({
        where: { id: automationJobId },
        data: { status: 'PROCESSING', startedAt: new Date(), attemptNumber: job.attemptsMade + 1 }
      });
    }
  }

  // Load pictureBook
  const pictureBook = await prisma.pictureBook.findUnique({
    where: { id: pictureBookId },
    include: {
      user: true,
    },
  });

  if (!pictureBook) throw new Error(`PictureBook ${pictureBookId} not found`);

  // We keep updating driveStatus for backward compatibility
  await prisma.pictureBook.update({
    where: { id: pictureBookId },
    data: { driveStatus: 'PROCESSING' }
  });
  await prisma.activityLog.create({
    data: { pictureBookId, action: 'DRIVE_GENERATION_STARTED', details: 'Drive generation job started in worker' }
  });

  let driveLink = pictureBook.driveLink;

  try {
    // Step 2: Create Drive folder if needed
    if (!driveLink) {
      if (pictureBook.user.email === 'production-test@marrowotif.internal') {
        console.log(`[Worker] 🧪 SYNTHETIC TEST: Mocking Drive folder creation for "${pictureBook.title}"`);
        
        if (pictureBook.title.includes('FAIL_DRIVE')) {
          throw new Error('Simulated Drive API Failure');
        }

        driveLink = `https://drive.google.com/drive/folders/synthetic-mock-folder-${pictureBook.id}`;
        
        await prisma.pictureBook.update({
          where: { id: pictureBookId },
          data: { driveLink, driveStatus: 'SUCCESS', driveError: null },
        });
        await prisma.activityLog.create({
          data: { pictureBookId, action: 'DRIVE_GENERATION_SUCCESS', details: driveLink }
        });
        console.log(`[Worker] ✅ Synthetic Drive link saved: ${driveLink}`);
      } else {
        console.log(`[Worker] 📁 Creating Drive folder for "${pictureBook.title}"`);
        // Lazy loading happens here! If provider fails, it throws!
        const driveProvider = drive; 
        
        const shortCode = pictureBook.id.substring(pictureBook.id.length - 4).toUpperCase();
        const folderName = `${pictureBook.title}-${pictureBook.user.name}-${shortCode}`;

        const driveResult = await driveProvider.createClientFolder(
          folderName
        );

        if (!driveResult.success || !driveResult.shareLink) {
          throw new Error(`Drive folder creation failed: ${driveResult.error}`);
        }

        driveLink = driveResult.shareLink;
        await prisma.pictureBook.update({
          where: { id: pictureBookId },
          data: { driveLink, driveStatus: 'SUCCESS', driveError: null },
        });
        await prisma.activityLog.create({
          data: { pictureBookId, action: 'DRIVE_GENERATION_SUCCESS', details: driveLink }
        });
        console.log(`[Worker] ✅ Drive link saved: ${driveLink}`);
      }
    } else {
      await prisma.pictureBook.update({
        where: { id: pictureBookId },
        data: { driveStatus: 'SUCCESS', driveError: null },
      });
      console.log(`[Worker] ⏭ Drive folder already exists, restored status to SUCCESS`);
    }

    if (automationJobId) {
      const durationMs = Date.now() - automationJob!.startedAt!.getTime();
      await prisma.automationJob.update({
        where: { id: automationJobId },
        data: { status: 'SUCCESS', completedAt: new Date(), durationMs, externalRef: driveLink }
      });
    }

    if (pictureBook.whatsappStatus === 'CONVERSATION_INITIATED' && pictureBook.user.whatsappNumber && driveLink) {
      const messageContent = `Your photo upload folder for “${pictureBook.title}” is ready!\n\nPlease upload your photos here:\n${driveLink}\n\nOnce your photos are uploaded, we’ll use them to create your picture book.`;
      await automationQueue.add('send-manual-whatsapp', { pictureBookId, messageContent, idempotencyKey: `wa-drive-ready-${pictureBookId}` }, { jobId: `wa-drive-ready-${pictureBookId}`, attempts: 3, removeOnComplete: false, removeOnFail: false });
    }

  } catch (error: any) {
    console.error(`[Worker] ❌ Error in drive generation: ${error.message}`);
    
    await prisma.pictureBook.update({
      where: { id: pictureBookId },
      data: { driveStatus: 'FAILED', driveError: error.message },
    });
    await prisma.activityLog.create({
      data: { pictureBookId, action: 'DRIVE_GENERATION_FAILED', details: error.message }
    });

    if (automationJobId) {
      const durationMs = Date.now() - automationJob!.startedAt!.getTime();
      await prisma.automationJob.update({
        where: { id: automationJobId },
        data: { status: 'FAILED', completedAt: new Date(), durationMs, failureReason: error.message }
      });
    }

    throw error;
  }

  await prisma.pictureBook.update({ where: { id: pictureBookId }, data: { status: 'UPLOAD_PENDING' } });
  await prisma.activityLog.create({
    data: { pictureBookId, action: 'UPLOAD_INSTRUCTIONS_READY', details: 'The website upload folder is ready.' }
  });
  return { success: true, driveLink };
}

async function processManualWhatsApp(job: Job) {
  const { pictureBookId, messageContent, idempotencyKey, toNumber: directNumber } = job.data as { pictureBookId: string | null, messageContent: string, idempotencyKey?: string, toNumber?: string };
  console.log(`\n[Worker] 📱 Processing job ${job.id}`);
  console.log(`[Worker] Message: ${messageContent.substring(0, 100)}...`);

  let whatsappNumber: string | null = null;
  let pictureBook: any = null;

  if (directNumber) {
    whatsappNumber = directNumber;
    console.log(`[Worker] Using direct number: ${whatsappNumber}`);
  }

  if (pictureBookId) {
    pictureBook = await prisma.pictureBook.findUnique({
      where: { id: pictureBookId },
      include: { user: true },
    });

    if (!pictureBook) {
      console.error(`[Worker] PictureBook ${pictureBookId} not found`);
      throw new Error(`PictureBook ${pictureBookId} not found`);
    }
    if (!whatsappNumber) {
      whatsappNumber = pictureBook.user.whatsappNumber;
      if (!whatsappNumber) {
        console.error(`[Worker] User ${pictureBook.user.id} has no WhatsApp number`);
        throw new Error(`User does not have a WhatsApp number`);
      }
      console.log(`[Worker] Checking conversation window...`);
      console.log(`[Worker] Status: ${pictureBook.whatsappStatus}, lastInbound: ${pictureBook.lastInboundMessageAt}, windowOpenUntil: ${pictureBook.whatsappConversationOpenUntil}`);
      if (pictureBook.whatsappStatus !== 'CONVERSATION_INITIATED' || !pictureBook.lastInboundMessageAt || !pictureBook.whatsappConversationOpenUntil || pictureBook.whatsappConversationOpenUntil <= new Date()) {
        console.error(`[Worker] WhatsApp customer-service window is not open`);
        throw new Error('WhatsApp customer-service window is not open');
      }
    } else {
      console.log(`[Worker] Skipping conversation window check (cross-user match)`);
    }
  } else if (!directNumber) {
    console.error(`[Worker] No pictureBookId or toNumber provided`);
    throw new Error('No pictureBookId or toNumber provided');
  }

  console.log(`[Worker] Target number: ${whatsappNumber}`);

  let waMessage = idempotencyKey
    ? await prisma.whatsAppMessage.upsert({
      where: { idempotencyKey },
      update: {},
      create: { pictureBookId: pictureBookId || null, status: 'QUEUED', attempts: 0, idempotencyKey, body: messageContent, senderNumber: whatsappNumber },
    })
    : await prisma.whatsAppMessage.create({ data: { pictureBookId: pictureBookId || null, status: 'QUEUED', attempts: 0, body: messageContent, senderNumber: whatsappNumber } });

  if (['SENT', 'DELIVERED', 'READ'].includes(waMessage.status)) return { success: true, messageId: waMessage.providerMessageId };

  let waResult;
  const isSynthetic = whatsappNumber === '+15550000000' || (pictureBook?.user?.email === 'production-test@marrowotif.internal');
  
  if (isSynthetic) {
    console.log(`[Worker] 🧪 SYNTHETIC TEST: Mocking manual WhatsApp to ${whatsappNumber}`);
    waResult = { success: true, messageId: `synthetic-manual-msg-${Date.now()}` };
  } else {
    try {
      console.log(`[Worker] Sending WhatsApp to ${whatsappNumber}...`);
      const waProvider = whatsApp;
      waResult = await waProvider.sendTextMessage(
        whatsappNumber,
        messageContent
      );
      console.log(`[Worker] WhatsApp send result:`, JSON.stringify(waResult));
    } catch (e: any) {
      console.error(`[Worker] WhatsApp send error:`, e.message);
      waResult = { success: false, error: e.message };
    }
  }

  const attempts = 1;

  if (!waResult.success) {
    await prisma.whatsAppMessage.update({
      where: { id: waMessage.id },
      data: { status: 'FAILED', errorMessage: waResult.error, attempts },
    });
    throw new Error(`WhatsApp send failed: ${waResult.error}`);
  }

  await prisma.whatsAppMessage.update({
    where: { id: waMessage.id },
    data: {
      status: 'SENT',
      providerMessageId: waResult.messageId,
      attempts,
      sentAt: new Date(),
      errorMessage: null,
    },
  });

  return { success: true, messageId: waResult.messageId };
}

worker.on('completed', (job, result) => {
  console.log(`[Worker] ✅ Job ${job.id} completed:`, JSON.stringify(result));
});

worker.on('failed', (job, err) => {
  console.error(`[Worker] ❌ Job ${job?.id} failed (attempt ${job?.attemptsMade}):`, err.message);
});

worker.on('error', (err) => {
  console.error('[Worker] Error:', err);
});

async function shutdown() {
  console.log('\n[Worker] Shutting down...');
  await worker.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

console.log('✅ Worker listening on queue: google-drive');
