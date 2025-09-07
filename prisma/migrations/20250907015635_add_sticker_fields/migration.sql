-- AlterTable
ALTER TABLE "public"."Sticker" ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "saintId" TEXT,
ADD COLUMN     "type" TEXT,
ADD COLUMN     "year" INTEGER;

-- AddForeignKey
ALTER TABLE "public"."Sticker" ADD CONSTRAINT "Sticker_saintId_fkey" FOREIGN KEY ("saintId") REFERENCES "public"."Saint"("id") ON DELETE SET NULL ON UPDATE CASCADE;
