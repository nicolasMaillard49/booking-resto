-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "reviewRequestSentAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "bookings_reviewRequestSentAt_idx" ON "bookings"("reviewRequestSentAt");
