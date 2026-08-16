DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DriveStatus') THEN
        CREATE TYPE "DriveStatus" AS ENUM ('QUEUED', 'PROCESSING', 'SUCCESS', 'FAILED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DeliveryPreference') THEN
        CREATE TYPE "DeliveryPreference" AS ENUM ('HOME_DELIVERY', 'BEFORE_DEPARTURE');
    END IF;
END
$$;

ALTER TABLE "picture_books" ADD COLUMN IF NOT EXISTS "driveStatus" "DriveStatus";
ALTER TABLE "picture_books" ADD COLUMN IF NOT EXISTS "driveError" TEXT;
ALTER TABLE "picture_books" ADD COLUMN IF NOT EXISTS "jobId" TEXT;
ALTER TABLE "picture_books" ADD COLUMN IF NOT EXISTS "deliveryPreference" "DeliveryPreference";
ALTER TABLE "picture_books" ADD COLUMN IF NOT EXISTS "departureDate" TIMESTAMP(3);
ALTER TABLE "picture_books" ADD COLUMN IF NOT EXISTS "departureTime" TEXT;
ALTER TABLE "picture_books" ADD COLUMN IF NOT EXISTS "flightNumber" TEXT;
ALTER TABLE "picture_books" ADD COLUMN IF NOT EXISTS "departureAirport" TEXT;
ALTER TABLE "picture_books" ADD COLUMN IF NOT EXISTS "deliveryAddressLine1" TEXT;
ALTER TABLE "picture_books" ADD COLUMN IF NOT EXISTS "deliveryAddressLine2" TEXT;
ALTER TABLE "picture_books" ADD COLUMN IF NOT EXISTS "deliveryCity" TEXT;
ALTER TABLE "picture_books" ADD COLUMN IF NOT EXISTS "deliveryState" TEXT;
ALTER TABLE "picture_books" ADD COLUMN IF NOT EXISTS "deliveryPostalCode" TEXT;
ALTER TABLE "picture_books" ADD COLUMN IF NOT EXISTS "deliveryCountry" TEXT;
