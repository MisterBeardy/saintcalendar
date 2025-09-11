import { vi } from 'vitest';

// Mock NextAuth session
export const mockSession = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
  },
  expires: '2024-12-31T23:59:59.999Z',
};

// Mock BullMQ Queue
export const mockQueue = {
  add: vi.fn(),
  getJob: vi.fn(),
  getJobs: vi.fn(),
};

// Helper to create test workflow
export const createTestWorkflow = (overrides = {}) => ({
  id: 'test-workflow-id',
  userId: 'test-user-id',
  spreadsheetId: 'test-spreadsheet-id',
  status: 'pending',
  currentPhase: 'scan',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Helper to create test location data
export const createTestLocationData = (overrides = {}) => ({
  location: {
    id: 'test-location-id',
    state: 'TX',
    city: 'Austin',
    displayName: 'Austin, TX',
    address: '123 Main St',
    sheetId: '1aBcDeFgHiJkLmNoPqRsTuVwXyZ',
    isActive: true,
    phoneNumber: '555-0101',
    managerEmail: 'manager@austin.com',
  },
  saints: [
    {
      saintNumber: '001',
      name: 'John Doe',
      saintName: 'St. John',
      saintDate: 'January 15',
      saintYear: 2023,
    },
  ],
  saintYears: [
    {
      year: 2023,
      burger: 'Classic Burger',
      tapBeerList: ['IPA', 'Stout'],
      canBottleBeerList: ['Cola', 'Lemonade'],
      saintNumber: '001',
      name: 'John Doe',
      saintName: 'St. John',
      saintDate: 'January 15',
    },
  ],
  milestones: [
    {
      count: 100,
      date: '2023-06-15',
      sticker: 'Century Club',
    },
  ],
  errors: [],
  ...overrides,
});

// Helper to reset all mocks
export const resetAllMocks = () => {
  vi.clearAllMocks();
};