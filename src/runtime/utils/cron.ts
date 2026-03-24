import { useNitroApp } from 'nitropack/runtime'
import type { CronManager } from '../server'

declare module 'nitropack' {
  interface NitroApp {
    cronManager: CronManager
  }
}

/**
 * Returns the CronManager instance.
 * Use this in server routes, plugins, or utilities to manage cron jobs at runtime.
 *
 * @example
 * // server/api/jobs/[name]/toggle.post.ts
 * export default defineEventHandler(async (event) => {
 *   const cron = useCron()
 *   const { name, action } = await readBody(event)
 *   if (action === 'start') cron.start(name)
 *   if (action === 'stop') cron.stop(name)
 *   return cron.status(name)
 * })
 */
export function useCron(): CronManager {
  const app = useNitroApp()
  if (!app.cronManager) {
    throw new Error(
      '[nuxt-cron] CronManager is not initialized. '
      + 'Make sure the nuxt-cron module is loaded and job files exist in server/cron/.',
    )
  }
  return app.cronManager
}
