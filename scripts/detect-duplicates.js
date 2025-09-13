#!/usr/bin/env node

import { PrismaClient } from '../lib/generated/prisma/index.js';

const prisma = new PrismaClient();

async function detectDuplicateSaints() {
  console.log('\n=== Detecting Saints in Multiple Locations ===');

  try {
    // Find saints with same name appearing in different locations
    const duplicateSaintsByName = await prisma.$queryRaw`
      SELECT
        s."name",
        COUNT(DISTINCT s."locationId") as location_count,
        ARRAY_AGG(DISTINCT l."city" || ', ' || l."state") as locations,
        ARRAY_AGG(s."id") as saint_ids,
        ARRAY_AGG(s."saintNumber") as saint_numbers
      FROM "Saint" s
      LEFT JOIN "Location" l ON s."locationId" = l."id"
      GROUP BY s."name"
      HAVING COUNT(DISTINCT s."locationId") > 1
      ORDER BY location_count DESC
    `;

    console.log(`Found ${duplicateSaintsByName.length} saints with same name in multiple locations:`);
    duplicateSaintsByName.forEach(row => {
      console.log(`- Name: ${row.name}`);
      console.log(`  Locations (${row.location_count}): ${row.locations.join('; ')}`);
      console.log(`  Saint IDs: ${row.saint_ids.join(', ')}`);
      console.log(`  Saint Numbers: ${row.saint_numbers.join(', ')}\n`);
    });

    // Also check by saintName
    const duplicateSaintsBySaintName = await prisma.$queryRaw`
      SELECT
        s."saintName",
        COUNT(DISTINCT s."locationId") as location_count,
        ARRAY_AGG(DISTINCT l."city" || ', ' || l."state") as locations,
        ARRAY_AGG(s."id") as saint_ids,
        ARRAY_AGG(s."saintNumber") as saint_numbers
      FROM "Saint" s
      LEFT JOIN "Location" l ON s."locationId" = l."id"
      GROUP BY s."saintName"
      HAVING COUNT(DISTINCT s."locationId") > 1
      ORDER BY location_count DESC
    `;

    console.log(`Found ${duplicateSaintsBySaintName.length} saints with same saintName in multiple locations:`);
    duplicateSaintsBySaintName.forEach(row => {
      console.log(`- Saint Name: ${row.saintName}`);
      console.log(`  Locations (${row.location_count}): ${row.locations.join('; ')}`);
      console.log(`  Saint IDs: ${row.saint_ids.join(', ')}`);
      console.log(`  Saint Numbers: ${row.saint_numbers.join(', ')}\n`);
    });

  } catch (error) {
    console.error('Error detecting duplicate saints:', error.message);
  }
}

async function detectDuplicateSaintYears() {
  console.log('\n=== Detecting Duplicate SaintYear Records ===');

  try {
    const duplicateYears = await prisma.$queryRaw`
      SELECT
        sy."saintId",
        sy."year",
        COUNT(*) as duplicate_count,
        ARRAY_AGG(sy."id") as record_ids,
        s."name" as saint_name
      FROM "SaintYear" sy
      JOIN "Saint" s ON sy."saintId" = s."id"
      GROUP BY sy."saintId", sy."year", s."name"
      HAVING COUNT(*) > 1
      ORDER BY duplicate_count DESC
    `;

    console.log(`Found ${duplicateYears.length} cases of duplicate SaintYear records:`);
    duplicateYears.forEach(row => {
      console.log(`- Saint: ${row.saint_name} (ID: ${row.saintId})`);
      console.log(`  Year: ${row.year}`);
      console.log(`  Duplicate Count: ${row.duplicate_count}`);
      console.log(`  Record IDs: ${row.record_ids.join(', ')}\n`);
    });

  } catch (error) {
    console.error('Error detecting duplicate SaintYear records:', error.message);
  }
}

async function detectDuplicateMilestones() {
  console.log('\n=== Detecting Duplicate Milestone Records ===');

  try {
    // Duplicates by saintId and count
    const duplicateMilestonesByCount = await prisma.$queryRaw`
      SELECT
        m."saintId",
        m."count",
        COUNT(*) as duplicate_count,
        ARRAY_AGG(m."id") as record_ids,
        ARRAY_AGG(m."date") as dates,
        s."name" as saint_name
      FROM "Milestone" m
      JOIN "Saint" s ON m."saintId" = s."id"
      GROUP BY m."saintId", m."count", s."name"
      HAVING COUNT(*) > 1
      ORDER BY duplicate_count DESC
    `;

    console.log(`Found ${duplicateMilestonesByCount.length} cases of duplicate milestones by count:`);
    duplicateMilestonesByCount.forEach(row => {
      console.log(`- Saint: ${row.saint_name} (ID: ${row.saintId})`);
      console.log(`  Count: ${row.count}`);
      console.log(`  Duplicate Count: ${row.duplicate_count}`);
      console.log(`  Dates: ${row.dates.join(', ')}`);
      console.log(`  Record IDs: ${row.record_ids.join(', ')}\n`);
    });

    // Duplicates by saintId and date
    const duplicateMilestonesByDate = await prisma.$queryRaw`
      SELECT
        m."saintId",
        m."date",
        COUNT(*) as duplicate_count,
        ARRAY_AGG(m."id") as record_ids,
        ARRAY_AGG(m."count") as counts,
        s."name" as saint_name
      FROM "Milestone" m
      JOIN "Saint" s ON m."saintId" = s."id"
      GROUP BY m."saintId", m."date", s."name"
      HAVING COUNT(*) > 1
      ORDER BY duplicate_count DESC
    `;

    console.log(`Found ${duplicateMilestonesByDate.length} cases of duplicate milestones by date:`);
    duplicateMilestonesByDate.forEach(row => {
      console.log(`- Saint: ${row.saint_name} (ID: ${row.saintId})`);
      console.log(`  Date: ${row.date}`);
      console.log(`  Duplicate Count: ${row.duplicate_count}`);
      console.log(`  Counts: ${row.counts.join(', ')}`);
      console.log(`  Record IDs: ${row.record_ids.join(', ')}\n`);
    });

  } catch (error) {
    console.error('Error detecting duplicate milestones:', error.message);
  }
}

async function quantifyDuplicates() {
  console.log('\n=== Quantification Summary ===');

  try {
    // Total saints
    const totalSaints = await prisma.saint.count();
    console.log(`Total Saints: ${totalSaints}`);

    // Total locations
    const totalLocations = await prisma.location.count();
    console.log(`Total Locations: ${totalLocations}`);

    // Total SaintYear records
    const totalSaintYears = await prisma.saintYear.count();
    console.log(`Total SaintYear Records: ${totalSaintYears}`);

    // Total Milestones
    const totalMilestones = await prisma.milestone.count();
    console.log(`Total Milestone Records: ${totalMilestones}`);

    // Saints with multiple locations (by name)
    const saintsWithMultipleLocations = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM (
        SELECT s."name"
        FROM "Saint" s
        GROUP BY s."name"
        HAVING COUNT(DISTINCT s."locationId") > 1
      ) as sub
    `;
    console.log(`Saints with same name in multiple locations: ${saintsWithMultipleLocations[0].count}`);

    // Duplicate SaintYear records
    const duplicateSaintYearCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM (
        SELECT sy."saintId", sy."year"
        FROM "SaintYear" sy
        GROUP BY sy."saintId", sy."year"
        HAVING COUNT(*) > 1
      ) as sub
    `;
    console.log(`Duplicate SaintYear records (same saint + year): ${duplicateSaintYearCount[0].count}`);

    // Duplicate milestones by count
    const duplicateMilestoneCountByCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM (
        SELECT m."saintId", m."count"
        FROM "Milestone" m
        GROUP BY m."saintId", m."count"
        HAVING COUNT(*) > 1
      ) as sub
    `;
    console.log(`Duplicate milestones (same saint + count): ${duplicateMilestoneCountByCount[0].count}`);

    // Duplicate milestones by date
    const duplicateMilestoneCountByDate = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM (
        SELECT m."saintId", m."date"
        FROM "Milestone" m
        GROUP BY m."saintId", m."date"
        HAVING COUNT(*) > 1
      ) as sub
    `;
    console.log(`Duplicate milestones (same saint + date): ${duplicateMilestoneCountByDate[0].count}`);

  } catch (error) {
    console.error('Error quantifying duplicates:', error.message);
  }
}

async function main() {
  try {
    console.log('Starting duplicate detection analysis...');

    await detectDuplicateSaints();
    await detectDuplicateSaintYears();
    await detectDuplicateMilestones();
    await quantifyDuplicates();

    console.log('\nDuplicate detection analysis completed.');
  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();