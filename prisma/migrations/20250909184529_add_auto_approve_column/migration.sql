-- AlterTable
ALTER TABLE "ImportWorkflow" ADD COLUMN "autoApprove" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Job_status_updatedAt_idx" ON "Job"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "Job_userId_status_idx" ON "Job"("userId", "status");