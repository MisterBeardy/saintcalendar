-- AlterTable
ALTER TABLE "ImportWorkflow" ADD COLUMN     "importType" TEXT DEFAULT 'sheets';
ALTER TABLE "ImportWorkflow" ALTER COLUMN "spreadsheetId" DROP NOT NULL;