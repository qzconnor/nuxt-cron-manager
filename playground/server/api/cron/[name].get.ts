/**
 * GET /api/cron/:name
 * Get the status of a specific cron job.
 */
export default defineEventHandler((event) => {
  const name = getRouterParam(event, 'name')!
  const status = useCron().status(name)
  if (!status) {
    throw createError({ statusCode: 404, message: `Cron job "${name}" not found.` })
  }
  return status
})
