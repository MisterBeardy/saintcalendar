import { beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { PrismaClient } from '@/lib/generated/prisma';
import { execSync } from 'child_process';
import { mockGoogleSheetsAPI } from './utils/test-helpers';

// Test database setup
const prisma = new PrismaClient();

// Mock NextAuth
vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}));

// Mock Prisma
vi.mock('@/lib/generated/prisma', () => {
  const mockPrismaClient = {
    importPhase: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    importWorkflow: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    location: {
      upsert: vi.fn(),
    },
    saint: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    saintYear: {
      findFirst: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    milestone: {
      create: vi.fn(),
    },
    event: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(),
    $disconnect: vi.fn(),
  };

  return {
    PrismaClient: vi.fn().mockImplementation(() => mockPrismaClient),
  };
});

// Mock BullMQ
vi.mock('bullmq', () => ({
  Queue: vi.fn().mockImplementation(() => ({
    add: vi.fn(),
    getJob: vi.fn(),
    getJobs: vi.fn(),
  })),
  Worker: vi.fn(),
}));

// Setup mocks
beforeAll(() => {
  // Mocks are set up above
});

// Setup test database
beforeAll(async () => {
  // Create test database if it doesn't exist
  try {
    execSync('npx prisma migrate deploy --schema=./prisma/schema.prisma', {
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL + '_test' }
    });
  } catch (error) {
    console.log('Test database setup skipped:', error.message);
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clean up test data
  try {
    await prisma.$transaction([
      prisma.event.deleteMany(),
      prisma.saintYear.deleteMany(),
      prisma.milestone.deleteMany(),
      prisma.saint.deleteMany(),
      prisma.location.deleteMany(),
      prisma.importWorkflow.deleteMany(),
      prisma.importJob.deleteMany(),
    ]);
  } catch (error) {
    console.log('Database cleanup skipped:', error.message);
  }
});

export { prisma };