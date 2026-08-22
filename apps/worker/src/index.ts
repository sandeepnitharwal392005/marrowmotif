import 'dotenv/config';
import { Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { createProviders } from './providers';

const prisma = new PrismaClient();
const { whatsApp, drive, isDemoMode } = createProviders();

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
    connection: {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    },
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
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
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
        
        const driveResult = await driveProvider.createClientFolder(
          pictureBook.user.name,
          pictureBook.id,
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

  // Step 3: Check idempotency for WhatsApp
  const lastMsg = pictureBook.messages[0];
  if (lastMsg && ['SENT', 'DELIVERED', 'READ'].includes(lastMsg.status)) {
    console.log(`[Worker] ⏭ WhatsApp already sent`);
    await prisma.pictureBook.update({ where: { id: pictureBookId }, data: { status: 'UPLOAD_PENDING' } });
    return { success: true };
  }

  // WhatsApp logic (simplified for space, same as before but uses lazy loading)
  if (pictureBook.user.phone) {
    let waMessage = await prisma.whatsAppMessage.findFirst({
      where: { pictureBookId, status: { in: ['QUEUED', 'FAILED'] } },
      orderBy: { createdAt: 'desc' },
    });

    if (!waMessage) {
      waMessage = await prisma.whatsAppMessage.create({
        data: { pictureBookId, status: 'QUEUED', attempts: 0 },
      });
    }

    await prisma.activityLog.create({
      data: { pictureBookId, action: 'WHATSAPP_SEND_STARTED', details: `Attempting to send WhatsApp message to ${pictureBook.user.phone || 'unknown'}` }
    });

    let waResult;
    const isSynthetic = pictureBook.user.phone === '+15550000000' || pictureBook.user.email === 'production-test@marrowotif.internal';
    
    try {
      if (isSynthetic) {
        waResult = { success: true, messageId: `synthetic-msg-${Date.now()}` };
      } else {
        const waProvider = whatsApp; // Lazy load!
        waResult = await waProvider.sendTemplateMessage(
          pictureBook.user.phone,
          pictureBook.user.name,
          driveLink,
        );
        if (!waResult.success) throw new Error(waResult.error);
      }

      await prisma.whatsAppMessage.update({
        where: { id: waMessage.id },
        data: { status: 'SENT', providerMessageId: waResult.messageId, attempts: waMessage.attempts + 1, sentAt: new Date(), errorMessage: null },
      });

      await prisma.activityLog.create({
        data: { pictureBookId, action: 'WHATSAPP_SEND_SUCCESS', details: `Message ID: ${waResult.messageId}` }
      });
      
      await prisma.pictureBook.update({ where: { id: pictureBookId }, data: { status: 'UPLOAD_PENDING' } });
      return { success: true, messageId: waResult.messageId, driveLink };

    } catch (waError: any) {
      await prisma.whatsAppMessage.update({
        where: { id: waMessage.id },
        data: { status: 'FAILED', errorMessage: waError.message, attempts: waMessage.attempts + 1 },
      });

      await prisma.activityLog.create({
        data: { pictureBookId, action: 'WHATSAPP_SEND_FAILED', details: waError.message }
      });

      throw new Error(`WhatsApp send failed: ${waError.message}`);
    }
  } else {
    await prisma.pictureBook.update({ where: { id: pictureBookId }, data: { status: 'UPLOAD_PENDING' } });
    return { success: true, driveLink };
  }
}

async function processManualWhatsApp(job: Job) {
  const { pictureBookId, messageContent } = job.data as { pictureBookId: string, messageContent: string };
  console.log(`\n[Worker] 📱 Sending manual WhatsApp for pictureBook ${pictureBookId}`);

  const pictureBook = await prisma.pictureBook.findUnique({
    where: { id: pictureBookId },
    include: { user: true },
  });

  if (!pictureBook) throw new Error(`PictureBook ${pictureBookId} not found`);
  if (!pictureBook.user.phone) throw new Error(`User does not have a phone number`);

  let waMessage = await prisma.whatsAppMessage.create({
    data: { pictureBookId, status: 'QUEUED', attempts: 0 },
  });

  let waResult;
  const isSynthetic = pictureBook.user.phone === '+15550000000' || pictureBook.user.email === 'production-test@marrowotif.internal';
  
  if (isSynthetic) {
    console.log(`[Worker] 🧪 SYNTHETIC TEST: Mocking manual WhatsApp to ${pictureBook.user.phone}`);
    waResult = { success: true, messageId: `synthetic-manual-msg-${Date.now()}` };
  } else {
    try {
      const waProvider = whatsApp;
      waResult = await waProvider.sendTextMessage(
        pictureBook.user.phone,
        messageContent
      );
    } catch (e: any) {
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
