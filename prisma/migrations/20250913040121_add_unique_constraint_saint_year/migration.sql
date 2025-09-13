-- Create unique index on SaintYear (saintId, year)
-- This migration should be run AFTER deduplication to prevent future duplicates
CREATE UNIQUE INDEX "SaintYear_saintId_year_key" ON "SaintYear"("saintId", "year");