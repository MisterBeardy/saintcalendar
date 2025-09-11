/*
  Warnings:

  - You are about to drop the column `opened` on the `Location` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."LocationStatus" AS ENUM ('OPEN', 'PENDING', 'CLOSED');

-- AlterTable
ALTER TABLE "public"."Location" DROP COLUMN "opened",
ADD COLUMN     "closingDate" TIMESTAMP(3),
ADD COLUMN     "openedDate" TIMESTAMP(3),
ADD COLUMN     "openingDate" TIMESTAMP(3),
ADD COLUMN     "status" "public"."LocationStatus";
