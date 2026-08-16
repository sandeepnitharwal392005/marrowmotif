-- CreateEnum
CREATE TYPE "DriveStatus" AS ENUM ('QUEUED', 'PROCESSING', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "DeliveryPreference" AS ENUM ('HOME_DELIVERY', 'BEFORE_DEPARTURE');

-- AlterTable
ALTER TABLE "picture_books"
ADD COLUMN "driveStatus" "DriveStatus",
ADD COLUMN "driveError" TEXT,
ADD COLUMN "jobId" TEXT,
ADD COLUMN "deliveryPreference" "DeliveryPreference",
ADD COLUMN "departureDate" TIMESTAMP(3),
ADD COLUMN "departureTime" TEXT,
ADD COLUMN "flightNumber" TEXT,
ADD COLUMN "departureAirport" TEXT,
ADD COLUMN "deliveryAddressLine1" TEXT,
ADD COLUMN "deliveryAddressLine2" TEXT,
ADD COLUMN "deliveryCity" TEXT,
ADD COLUMN "deliveryState" TEXT,
ADD COLUMN "deliveryPostalCode" TEXT,
ADD COLUMN "deliveryCountry" TEXT;
