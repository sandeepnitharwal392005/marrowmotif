ALTER TYPE "WhatsAppMessageStatus" ADD VALUE IF NOT EXISTS 'QUEUED';

CREATE TYPE "WhatsAppOptInStatus" AS ENUM ('NOT_REQUESTED', 'DECLINED', 'LINK_GENERATED', 'MESSAGE_NOT_RECEIVED', 'CONVERSATION_INITIATED', 'UPDATE_SENT', 'PROCESSING_FAILED');

ALTER TABLE "picture_books" ADD COLUMN "whatsappStatus" "WhatsAppOptInStatus" NOT NULL DEFAULT 'NOT_REQUESTED';
ALTER TABLE "picture_books" ADD COLUMN "whatsappLinkGeneratedAt" TIMESTAMP(3);
ALTER TABLE "picture_books" ADD COLUMN "whatsappMessageReceivedAt" TIMESTAMP(3);
ALTER TABLE "picture_books" ADD COLUMN "lastInboundMessageAt" TIMESTAMP(3);
ALTER TABLE "picture_books" ADD COLUMN "whatsappConversationOpenUntil" TIMESTAMP(3);

ALTER TABLE "whatsapp_messages" ADD COLUMN "direction" TEXT NOT NULL DEFAULT 'OUTBOUND';
ALTER TABLE "whatsapp_messages" ADD COLUMN "body" TEXT;
ALTER TABLE "whatsapp_messages" ADD COLUMN "senderNumber" TEXT;
ALTER TABLE "whatsapp_messages" ADD COLUMN "providerEventId" TEXT;
ALTER TABLE "whatsapp_messages" ADD COLUMN "idempotencyKey" TEXT;
CREATE UNIQUE INDEX "whatsapp_messages_providerEventId_key" ON "whatsapp_messages"("providerEventId");
CREATE UNIQUE INDEX "whatsapp_messages_idempotencyKey_key" ON "whatsapp_messages"("idempotencyKey");

CREATE TABLE "whatsapp_webhook_events" (
	"id" TEXT NOT NULL,
	"providerEventId" TEXT NOT NULL,
	"senderNumber" TEXT,
	"body" TEXT,
	"matched" BOOLEAN NOT NULL DEFAULT false,
	"matchedPictureBookId" TEXT,
	"processingStatus" TEXT NOT NULL DEFAULT 'RECEIVED',
	"errorMessage" TEXT,
	"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "whatsapp_webhook_events_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "whatsapp_webhook_events_providerEventId_key" ON "whatsapp_webhook_events"("providerEventId");
CREATE INDEX "whatsapp_webhook_events_senderNumber_idx" ON "whatsapp_webhook_events"("senderNumber");