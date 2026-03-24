/**
 * PATCH /api/cron/:name
 * Control a cron job.
 *
 * Body: { "action": "start" | "stop" | "restart" }
 */
export default defineEventHandler(async (event) => {
  const name = getRouterParam(event, 'name')!
  const body = await readBody<{ action: 'start' | 'stop' | 'restart' }>(event)
  const cron = useCron()

  const actions = {
    start: () => cron.start(name),
    stop: () => cron.stop(name),
    restart: () => cron.restart(name),
  } as const

  if (!body?.action || !(body.action in actions)) {
    throw createError({ statusCode: 400, message: 'Invalid action. Use "start", "stop", or "restart".' })
  }

  const success = actions[body.action]()
  if (!success) {
    throw createError({ statusCode: 404, message: `Cron job "${name}" not found.` })
  }

  return cron.status(name)
})
