import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  mapMasterLocationData,
  processSaintsDataTab,
  processHistoricalDataTab,
  processMilestone,
  resetApiTracking,
} from '@/lib/import/processing';
import { mockMasterSheetData, mockSaintData, mockHistoricalData, mockMilestoneData, resetAllMocks } from './test-helpers';

describe('Import Processing Utilities', () => {
  beforeEach(() => {
    resetAllMocks();
    resetApiTracking();
  });

  describe('mapMasterLocationData', () => {
    it('should correctly map valid location data', () => {
      // Arrange
      const headerMap = {
        state: 0,
        city: 1,
        address: 2,
        sheetId: 3,
        isActive: 4,
        phoneNumber: 5,
        managerEmail: 6,
        openedDate: 7,
      };
      const row = ['TX', 'Austin', '123 Main St', '1aBcDeFgHiJkLmNoPqRsTuVwXyZ', 'true', '555-0101', 'manager@test.com', '2023-01-01'];

      // Act
      const result = mapMasterLocationData(row, headerMap, 'Open');

      // Assert
      expect(result).toEqual({
        id: '1aBcDeFgHiJkLmNoPqRsTuVwXyZ',
        state: 'TX',
        city: 'Austin',
        displayName: 'Austin, TX',
        address: '123 Main St',
        sheetId: '1aBcDeFgHiJkLmNoPqRsTuVwXyZ',
        isActive: true,
        phoneNumber: '555-0101',
        managerEmail: 'manager@test.com',
        status: 'Open',
        openedDate: '2023-01-01',
        openingDate: undefined,
        closedDate: undefined,
      });
    });

    it('should return null for incomplete data', () => {
      // Arrange
      const headerMap = {
        state: 0,
        city: 1,
        address: 2,
        sheetId: 3,
      };
      const row = ['TX', 'Austin', '123 Main St']; // Missing sheetId

      // Act
      const result = mapMasterLocationData(row, headerMap, 'Open');

      // Assert
      expect(result).toBeNull();
    });

    it('should handle boolean conversion correctly', () => {
      // Arrange
      const headerMap = {
        state: 0,
        city: 1,
        address: 2,
        sheetId: 3,
        isActive: 4,
      };
      const row = ['TX', 'Austin', '123 Main St', '1aBcDeFgHiJkLmNoPqRsTuVwXyZ', 'false'];

      // Act
      const result = mapMasterLocationData(row, headerMap, 'Open');

      // Assert
      expect(result?.isActive).toBe(false);
    });
  });

  describe('processSaintsDataTab', () => {
    it('should process valid saints data correctly', () => {
      // Act
      const result = processSaintsDataTab(mockSaintData);

      // Assert
      expect(result.saints).toHaveLength(3);
      expect(result.errors).toHaveLength(0);
      expect(result.saints[0]).toEqual({
        saintNumber: '001',
        name: 'John Doe',
        saintName: 'St. John',
        saintDate: 'January 15',
        saintYear: 2023,
      });
    });

    it('should handle empty data gracefully', () => {
      // Act
      const result = processSaintsDataTab([]);

      // Assert
      expect(result.saints).toHaveLength(0);
      expect(result.errors).toContain('Saint Data tab is empty');
    });

    it('should handle missing headers', () => {
      // Arrange
      const invalidData = [
        ['Wrong Header 1', 'Wrong Header 2'],
        ['001', 'John Doe'],
      ];

      // Act
      const result = processSaintsDataTab(invalidData);

      // Assert
      expect(result.saints).toHaveLength(0);
      expect(result.errors).toContain('Missing headers in Saint Data tab: saint number, saint name, saint date');
    });

    it('should skip incomplete rows', () => {
      // Arrange
      const incompleteData = [
        ['Saint Number', 'Real Name', 'Saint Name', 'Saint Date'],
        ['001', 'John Doe', 'St. John'], // Missing saint date
        ['002', 'Jane Smith', 'St. Jane', 'February 20'],
      ];

      // Act
      const result = processSaintsDataTab(incompleteData);

      // Assert
      expect(result.saints).toHaveLength(1);
      expect(result.saints[0].saintNumber).toBe('002');
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('processHistoricalDataTab', () => {
    it('should process valid historical data correctly', () => {
      // Act
      const result = processHistoricalDataTab(mockHistoricalData);

      // Assert
      expect(result.saintYears).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
      expect(result.saintYears[0]).toEqual({
        year: 2023,
        burger: 'Classic Burger',
        tapBeerList: ['IPA', 'Stout'],
        canBottleBeerList: ['Cola', 'Lemonade'],
        saintNumber: '001',
        name: 'John Doe',
        saintName: 'St. John',
        saintDate: 'January 15',
      });
    });

    it('should handle missing required headers', () => {
      // Arrange
      const invalidData = [
        ['Wrong Header'],
        ['2023'],
      ];

      // Act
      const result = processHistoricalDataTab(invalidData);

      // Assert
      expect(result.saintYears).toHaveLength(0);
      expect(result.errors).toContain('Missing required headers in Historical Data tab: Saint Number, Real Name, Saint Name, Saint Date, Historical Year');
    });

    it('should validate historical year range', () => {
      // Arrange
      const invalidYearData = [
        ['Saint Number', 'Real Name', 'Saint Name', 'Saint Date', 'Historical Year'],
        ['001', 'John Doe', 'St. John', 'January 15', '1899'], // Year too low
      ];

      // Act
      const result = processHistoricalDataTab(invalidYearData);

      // Assert
      expect(result.saintYears).toHaveLength(0);
      expect(result.errors).toContain('Invalid Historical Year in Historical Data row 2: "1899" (must be a number between 1900-2100)');
    });
  });

  describe('processMilestone', () => {
    it('should process valid milestone data correctly', () => {
      // Act
      const result = processMilestone(mockMilestoneData);

      // Assert
      expect(result.milestones).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
      expect(result.milestones[0]).toEqual({
        count: 100,
        date: '2023-06-15',
        sticker: 'Century Club',
      });
    });

    it('should handle invalid milestone count', () => {
      // Arrange
      const invalidData = [
        ['Saint Number', 'Real Name', 'Saint Name', 'Saint Date', 'Historical Milestone', 'Milestone Date'],
        ['001', 'John Doe', 'St. John', 'January 15', 'invalid', '2023-06-15'],
      ];

      // Act
      const result = processMilestone(invalidData);

      // Assert
      expect(result.milestones).toHaveLength(0);
      expect(result.errors).toContain('Invalid milestone count in Milestone Data row 2: invalid');
    });

    it('should handle missing milestone date', () => {
      // Arrange
      const invalidData = [
        ['Saint Number', 'Real Name', 'Saint Name', 'Saint Date', 'Historical Milestone', 'Milestone Date'],
        ['001', 'John Doe', 'St. John', 'January 15', '100'], // Missing date
      ];

      // Act
      const result = processMilestone(invalidData);

      // Assert
      expect(result.milestones).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
    });
  });
});