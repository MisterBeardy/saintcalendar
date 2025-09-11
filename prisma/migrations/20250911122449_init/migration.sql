/*
  Warnings:

  - Made the column `importType` on table `ImportWorkflow` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."ImportWorkflow" ALTER COLUMN "importType" SET NOT NULL;
