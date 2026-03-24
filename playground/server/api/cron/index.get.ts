/**
 * GET /api/cron
 * List all cron jobs and their current status.
 */
export default defineEventHandler(() => {
  return useCron().list()
})
