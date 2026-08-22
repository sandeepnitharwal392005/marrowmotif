CREATE TABLE "automation_jobs" (
  "id" TEXT NOT NULL,
  "jobId" TEXT,
  "pictureBookId" TEXT NOT NULL,
  "customerId" TEXT,
  "automationType" TEXT NOT NULL,
  "status" "DriveStatus" NOT NULL,
  "attemptNumber" INTEGER NOT NULL DEFAULT 0,
  "failureReason" TEXT,
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "durationMs" INTEGER,
  "correlationId" TEXT,
  "externalRef" TEXT,
  CONSTRAINT "automation_jobs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "automation_jobs_pictureBookId_idx" ON "automation_jobs"("pictureBookId");
CREATE INDEX "automation_jobs_status_idx" ON "automation_jobs"("status");
ALTER TABLE "automation_jobs" ADD CONSTRAINT "automation_jobs_pictureBookId_fkey" FOREIGN KEY ("pictureBookId") REFERENCES "picture_books"("id") ON DELETE CASCADE ON UPDATE CASCADE;