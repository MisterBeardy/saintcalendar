import { describe, it, expect } from 'vitest'
import {
  cn,
  detectDateFormat,
  parseDate,
  normalizeToMonthDay,
  convertToNumericDate,
  isValidDate
} from '../lib/utils'

describe('cn utility', () => {
  it('should merge class names correctly', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2')
  })

  it('should handle conditional classes', () => {
    expect(cn('class1', true && 'class2', false && 'class3')).toBe('class1 class2')
  })
})

describe('Date utilities', () => {
  describe('detectDateFormat', () => {
    it('should detect MM/DD/YYYY format', () => {
      expect(detectDateFormat('01/15/2023')).toBe('mm/dd/yyyy')
      expect(detectDateFormat('12/31/2024')).toBe('mm/dd/yyyy')
    })

    it('should detect YYYY-MM-DD format', () => {
      expect(detectDateFormat('2023-01-15')).toBe('yyyy-mm-dd')
      expect(detectDateFormat('2024-12-31')).toBe('yyyy-mm-dd')
    })

    it('should detect month day format', () => {
      expect(detectDateFormat('January 15')).toBe('month day')
      expect(detectDateFormat('December 31')).toBe('month day')
    })

    it('should return unknown for invalid formats', () => {
      expect(detectDateFormat('invalid')).toBe('unknown')
      expect(detectDateFormat('')).toBe('unknown')
    })
  })

  describe('parseDate', () => {
    it('should parse MM/DD/YYYY format', () => {
      const date = parseDate('01/15/2023')
      expect(date).toBeInstanceOf(Date)
      expect(date?.getMonth()).toBe(0) // January is 0
      expect(date?.getDate()).toBe(15)
      expect(date?.getFullYear()).toBe(2023)
    })

    it('should parse YYYY-MM-DD format', () => {
      const date = parseDate('2023-01-15')
      expect(date).toBeInstanceOf(Date)
      expect(date?.getMonth()).toBe(0)
      expect(date?.getDate()).toBe(15)
      expect(date?.getFullYear()).toBe(2023)
    })

    it('should parse month day format', () => {
      const date = parseDate('January 15')
      expect(date).toBeInstanceOf(Date)
      expect(date?.getMonth()).toBe(0)
      expect(date?.getDate()).toBe(15)
    })

    it('should return null for invalid dates', () => {
      expect(parseDate('02/30/2023')).toBeNull() // Invalid date
      expect(parseDate('invalid')).toBeNull()
    })
  })

  describe('normalizeToMonthDay', () => {
    it('should normalize date to Month Day format', () => {
      expect(normalizeToMonthDay('01/15/2023')).toBe('January 15')
      expect(normalizeToMonthDay('2023-01-15')).toBe('January 15')
      expect(normalizeToMonthDay('January 15')).toBe('January 15')
    })

    it('should return null for invalid dates', () => {
      expect(normalizeToMonthDay('02/30/2023')).toBeNull()
      expect(normalizeToMonthDay('invalid')).toBeNull()
    })
  })

  describe('convertToNumericDate', () => {
    it('should convert to numeric format', () => {
      expect(convertToNumericDate('January 15')).toBe(115) // 1 * 100 + 15
      expect(convertToNumericDate('December 31')).toBe(1231) // 12 * 100 + 31
    })

    it('should return null for invalid dates', () => {
      expect(convertToNumericDate('invalid')).toBeNull()
    })
  })

  describe('isValidDate', () => {
    it('should validate correct dates', () => {
      expect(isValidDate('01/15/2023')).toBe(true)
      expect(isValidDate('2023-01-15')).toBe(true)
      expect(isValidDate('January 15')).toBe(true)
    })

    it('should invalidate incorrect dates', () => {
      expect(isValidDate('02/30/2023')).toBe(false)
      expect(isValidDate('invalid')).toBe(false)
    })
  })
})