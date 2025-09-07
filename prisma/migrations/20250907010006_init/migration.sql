-- CreateTable
CREATE TABLE "public"."Location" (
    "id" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "sheetId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL,
    "managerEmail" TEXT NOT NULL,
    "opened" TEXT,
    "exclude" TEXT,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Saint" (
    "id" TEXT NOT NULL,
    "saintNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "saintName" TEXT NOT NULL,
    "saintDate" TEXT NOT NULL,
    "saintYear" INTEGER NOT NULL,
    "locationId" TEXT,
    "totalBeers" INTEGER NOT NULL,

    CONSTRAINT "Saint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SaintYear" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "burger" TEXT NOT NULL,
    "tapBeerList" TEXT[],
    "canBottleBeerList" TEXT[],
    "facebookEvent" TEXT,
    "sticker" TEXT,
    "saintId" TEXT NOT NULL,

    CONSTRAINT "SaintYear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Milestone" (
    "id" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "sticker" TEXT,
    "saintId" TEXT NOT NULL,

    CONSTRAINT "Milestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Event" (
    "id" TEXT NOT NULL,
    "date" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "locationId" TEXT,
    "beers" INTEGER NOT NULL,
    "saintNumber" TEXT,
    "saintedYear" INTEGER,
    "month" INTEGER,
    "saintName" TEXT NOT NULL,
    "realName" TEXT NOT NULL,
    "sticker" TEXT,
    "eventType" TEXT NOT NULL,
    "burgers" INTEGER,
    "tapBeers" INTEGER,
    "canBottleBeers" INTEGER,
    "facebookEvent" TEXT,
    "burger" TEXT,
    "tapBeerList" TEXT[],
    "canBottleBeerList" TEXT[],
    "milestoneCount" INTEGER,
    "year" INTEGER,
    "saintId" TEXT,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Sticker" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "locationId" TEXT,

    CONSTRAINT "Sticker_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Saint_saintNumber_key" ON "public"."Saint"("saintNumber");

-- AddForeignKey
ALTER TABLE "public"."Saint" ADD CONSTRAINT "Saint_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "public"."Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SaintYear" ADD CONSTRAINT "SaintYear_saintId_fkey" FOREIGN KEY ("saintId") REFERENCES "public"."Saint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Milestone" ADD CONSTRAINT "Milestone_saintId_fkey" FOREIGN KEY ("saintId") REFERENCES "public"."Saint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Event" ADD CONSTRAINT "Event_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "public"."Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Event" ADD CONSTRAINT "Event_saintId_fkey" FOREIGN KEY ("saintId") REFERENCES "public"."Saint"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Sticker" ADD CONSTRAINT "Sticker_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "public"."Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
