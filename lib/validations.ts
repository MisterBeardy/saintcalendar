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