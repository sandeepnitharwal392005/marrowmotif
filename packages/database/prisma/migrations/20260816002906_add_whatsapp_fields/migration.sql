-- AlterTable
ALTER TABLE "users" ADD COLUMN     "otpAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "otpCode" TEXT,
ADD COLUMN     "otpExpiry" TIMESTAMP(3),
ADD COLUMN     "setupToken" TEXT,
ADD COLUMN     "setupTokenExpiry" TIMESTAMP(3),
ADD COLUMN     "whatsappNumber" TEXT,
ADD COLUMN     "whatsappVerified" BOOLEAN NOT NULL DEFAULT false;
