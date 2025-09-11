import { Queue, Worker } from 'bullmq'
import { Redis } from 'ioredis'

// Redis connection for queue
const redisConnection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
  lazyConnect: true
})

// Import queue
export const importQueue = new Queue('import', {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
  },
})

// Worker for processing import jobs
export const importWorker = new Worker('import', async (job) => {
  const { type, data } = job.data

  switch (type) {
    case 'google-sheets':
      // Handle Google Sheets import
      console.log('Processing Google Sheets import:', data)
      break
    case 'csv':
      // Handle CSV import
      console.log('Processing CSV import:', data)
      break
    default:
      throw new Error(`Unknown import type: ${type}`)
  }
}, {
  connection: redisConnection,
})

// Export queue methods
export const addImportJob = async (type: string, data: any) => {
  return await importQueue.add('import-job', { type, data })
}

export const getImportJobStatus = async (jobId: string) => {
  const job = await importQueue.getJob(jobId)
  if (!job) return null

  return {
    id: job.id,
    status: await job.getState(),
    progress: job.progress,
    data: job.data,
    result: job.returnvalue,
    error: job.failedReason,
  }
}

export const getUserJobs = async (userId: string, limit: number = 10) => {
  // This is a placeholder - in a real implementation, you'd query jobs by userId
  const jobs = await importQueue.getJobs(['active', 'waiting', 'completed', 'failed'], 0, limit - 1)
  return jobs.map(job => ({
    id: job.id,
    type: job.data?.type || 'unknown',
    spreadsheetId: job.data?.spreadsheetId,
    status: job.finishedOn ? 'completed' : job.failedReason ? 'failed' : 'processing',
    progress: job.progress,
    message: job.data?.message,
    error: job.failedReason,
    createdAt: job.processedOn || job.finishedOn || new Date(),
    updatedAt: job.finishedOn || new Date(),
    data: job.data
  }))
}

export const cancelJob = async (jobId: string, userId: string) => {
  try {
    const job = await importQueue.getJob(jobId)
    if (!job) {
      return { success: false, message: 'Job not found' }
    }

    await job.remove()
    return { success: true, message: 'Job cancelled successfully' }
  } catch (error) {
    return { success: false, message: 'Failed to cancel job' }
  }
}

export const retryJob = async (jobId: string, userId: string) => {
  try {
    const job = await importQueue.getJob(jobId)
    if (!job) {
      return { success: false, message: 'Job not found' }
    }

    await job.retry()
    return { success: true, message: 'Job retry initiated' }
  } catch (error) {
    return { success: false, message: 'Failed to retry job' }
  }
}

export const getJobStatus = async (jobId: string) => {
  return await getImportJobStatus(jobId)
}