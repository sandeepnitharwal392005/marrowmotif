-- Initial production schema for the canonical Prisma datamodel.
CREATE TYPE "Role" AS ENUM ('GUIDE', 'END_USER', 'ADMIN');
CREATE TYPE "PictureBookStatus" AS ENUM ('REQUESTED', 'UPLOAD_PENDING', 'PHOTOS_UPLOADED', 'UNDER_REVIEW', 'IN_PRODUCTION', 'READY', 'COMPLETED', 'CANCELLED');
CREATE TYPE "WhatsAppMessageStatus" AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED');
CREATE TYPE "DeliveryPreference" AS ENUM ('HOME_DELIVERY', 'BEFORE_DEPARTURE');
CREATE TYPE "IncidentPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');
CREATE TYPE "IncidentStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'END_USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "referredById" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "country" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "picture_books" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "PictureBookStatus" NOT NULL DEFAULT 'REQUESTED',
    "driveLink" TEXT,
    "jobId" TEXT,
    "deliveryPreference" "DeliveryPreference",
    "departureDate" TIMESTAMP(3),
    "departureTime" TEXT,
    "flightNumber" TEXT,
    "departureAirport" TEXT,
    "deliveryAddressLine1" TEXT,
    "deliveryAddressLine2" TEXT,
    "deliveryCity" TEXT,
    "deliveryState" TEXT,
    "deliveryPostalCode" TEXT,
    "deliveryCountry" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "picture_books_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "images" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "whatsapp_messages" (
    "id" TEXT NOT NULL,
    "pictureBookId" TEXT NOT NULL,
    "status" "WhatsAppMessageStatus" NOT NULL DEFAULT 'QUEUED',
    "providerMessageId" TEXT,
    "errorMessage" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "whatsapp_messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "pictureBookId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "contact_messages" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "status" TEXT NOT NULL,
    "details" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "requestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "incidents" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pictureBookId" TEXT,
    "priority" "IncidentPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "IncidentStatus" NOT NULL DEFAULT 'OPEN',
    "assignedToId" TEXT,
    "resolutionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "users_email_idx" ON "users"("email");
CREATE INDEX "users_role_idx" ON "users"("role");
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");
CREATE INDEX "products_slug_idx" ON "products"("slug");
CREATE INDEX "products_isActive_idx" ON "products"("isActive");
CREATE INDEX "picture_books_userId_idx" ON "picture_books"("userId");
CREATE INDEX "picture_books_status_idx" ON "picture_books"("status");
CREATE INDEX "whatsapp_messages_pictureBookId_idx" ON "whatsapp_messages"("pictureBookId");
CREATE INDEX "whatsapp_messages_status_idx" ON "whatsapp_messages"("status");
CREATE INDEX "activity_logs_pictureBookId_idx" ON "activity_logs"("pictureBookId");
CREATE INDEX "contact_messages_isRead_idx" ON "contact_messages"("isRead");
CREATE INDEX "contact_messages_createdAt_idx" ON "contact_messages"("createdAt");
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");
CREATE INDEX "refresh_tokens_token_idx" ON "refresh_tokens"("token");
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");
CREATE INDEX "audit_logs_resourceType_resourceId_idx" ON "audit_logs"("resourceType", "resourceId");
CREATE INDEX "incidents_userId_idx" ON "incidents"("userId");
CREATE INDEX "incidents_status_idx" ON "incidents"("status");

ALTER TABLE "users" ADD CONSTRAINT "users_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "picture_books" ADD CONSTRAINT "picture_books_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "products" ADD CONSTRAINT "products_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_pictureBookId_fkey" FOREIGN KEY ("pictureBookId") REFERENCES "picture_books"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_pictureBookId_fkey" FOREIGN KEY ("pictureBookId") REFERENCES "picture_books"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_pictureBookId_fkey" FOREIGN KEY ("pictureBookId") REFERENCES "picture_books"("id") ON DELETE SET NULL ON UPDATE CASCADE;
