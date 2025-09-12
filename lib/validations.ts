import { z } from 'zod'

export const databaseQuerySchema = z.object({
  table: z.enum(['saints', 'events', 'locations']),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional()
})

export const databaseEntrySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
})

// Pending Changes validation schemas
export const pendingChangeEntityTypeSchema = z.enum(['LOCATION', 'SAINT', 'STICKER'])

export const pendingChangeStatusSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED'])

export const createPendingChangeSchema = z.object({
  entityType: pendingChangeEntityTypeSchema,
  entityId: z.string().min(1),
  changes: z.record(z.string(), z.unknown()), // JSON object for changes
  requestedBy: z.string().optional()
})

export const updatePendingChangeSchema = z.object({
  changes: z.record(z.string(), z.unknown()).optional(),
  status: pendingChangeStatusSchema.optional(),
  reviewedBy: z.string().optional()
})

export const pendingChangeQuerySchema = z.object({
  entityType: pendingChangeEntityTypeSchema.optional(),
  entityId: z.string().optional(),
  status: pendingChangeStatusSchema.optional(),
  requestedBy: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10)
})