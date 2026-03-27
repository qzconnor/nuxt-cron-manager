import { Cron } from 'croner'
import type {
  CronJobDefinition,
  CronJobOptions,
  CronJobStatus,
  CronManagerOptions,
  CronTime,
} from './types'

export type { CronPresets, CronTime, CronJobOptions, CronJobDefinition, CronJobStatus, CronManagerOptions } from './types'

// ---------------------------------------------------------------------------
// Time presets
// ---------------------------------------------------------------------------

export const cronPresets: Record<string, string> = {
  everySecond: '* * * * * *',
  everyFiveSeconds: '*/5 * * * * *',
  everyTenSeconds: '*/10 * * * * *',
  everyThirtySeconds: '*/30 * * * * *',
  everyMinute: '*/1 * * * *',
  everyFiveMinutes: '*/5 * * * *',
  everyTenMinutes: '*/10 * * * *',
  everyThirtyMinutes: '*/30 * * * *',
  everyHour: '0 */1 * * *',
  everyTwoHours: '0 */2 * * *',
  everySixHours: '0 */6 * * *',
  everyTwelveHours: '0 */12 * * *',
  daily: '0 0 * * *',
  weekly: '0 0 * * 0',
  monthly: '0 0 1 * *',
  yearly: '0 0 1 1 *',
}

function resolveTime(time: CronTime): string {
  if (typeof time === 'function') return time()
  return cronPresets[time as string] ?? time
}

// ---------------------------------------------------------------------------
// defineCronJob — user-facing helper
// ---------------------------------------------------------------------------

/**
 * Define a cron job. Place this in `server/cron/*.ts`.
 *
 * @example
 * export default defineCronJob('everyMinute', async (userId?: string) => {
 *   console.log('tick', userId)
 * })
 *
 * // Then start with args:
 * cron.start('myJob', 'user-123')
 */
export function defineCronJob<TArgs extends unknown[] = []>(
  time: CronTime,
  callback: (...args: TArgs) => void | Promise<void>,
  options?: CronJobOptions,
): CronJobDefinition<TArgs> {
  return { time, run: callback, options }
}

// ---------------------------------------------------------------------------
// CronManager
// ---------------------------------------------------------------------------

interface ManagedJob {
  definition: CronJobDefinition<unknown[]>
  instance: Cron
  lastRun: Date | null
  enabled: boolean
  args: unknown[]
}

export class CronManager {
  private jobs = new Map<string, ManagedJob>()
  private opts: CronManagerOptions

  constructor(opts: CronManagerOptions = {}) {
    this.opts = opts
  }

  register(name: string, definition: CronJobDefinition<unknown[]>): void {
    if (this.jobs.has(name)) {
      console.warn(`[nuxt-cron] Job "${name}" already registered — skipping.`)
      return
    }

    const enabled = definition.options?.enabled ?? true
    const timezone = definition.options?.timezone ?? this.opts.timezone

    const managed: ManagedJob = {
      definition,
      instance: null as unknown as Cron,
      lastRun: null,
      enabled,
      args: [],
    }

    const instance = new Cron(
      resolveTime(definition.time),
      { paused: true, timezone, name },
      async () => {
        if (!managed.enabled) return
        managed.lastRun = new Date()
        try {
          await definition.run(...managed.args)
        }
        catch (err) {
          console.error(`[nuxt-cron] Error in job "${name}":`, err)
        }
      },
    )

    managed.instance = instance
    this.jobs.set(name, managed)

    if (enabled) {
      instance.resume()
    }

    if (enabled && definition.options?.runOnInit) {
      Promise.resolve(definition.run(...managed.args)).catch((err: unknown) =>
        console.error(`[nuxt-cron] runOnInit error in "${name}":`, err),
      )
    }
  }

  /** Enable and start a job, optionally passing args to the callback. Returns false if the job was not found. */
  start(name: string, ...args: unknown[]): boolean {
    const job = this.jobs.get(name)
    if (!job) {
      console.warn(`[nuxt-cron] start: job "${name}" not found.`)
      return false
    }
    if (args.length > 0) job.args = args
    job.enabled = true
    if (!job.instance.isStopped()) job.instance.resume()
    if (job.definition.options?.runOnInit) {
      Promise.resolve(job.definition.run(...job.args)).catch((err: unknown) =>
        console.error(`[nuxt-cron] runOnInit error in "${name}":`, err),
      )
    }
    return true
  }

  /** Disable and pause a job. Returns false if the job was not found. */
  stop(name: string): boolean {
    const job = this.jobs.get(name)
    if (!job) {
      console.warn(`[nuxt-cron] stop: job "${name}" not found.`)
      return false
    }
    job.enabled = false
    job.instance.pause()
    return true
  }

  /** Restart a job (pause → resume). Returns false if not found. */
  restart(name: string): boolean {
    const job = this.jobs.get(name)
    if (!job) {
      console.warn(`[nuxt-cron] restart: job "${name}" not found.`)
      return false
    }
    job.instance.pause()
    job.enabled = true
    job.instance.resume()
    return true
  }

  /** Start all registered jobs. */
  startAll(): void {
    for (const name of this.jobs.keys()) this.start(name)
  }

  /** Stop all registered jobs. */
  stopAll(): void {
    for (const name of this.jobs.keys()) this.stop(name)
  }

  /** Returns true if the job is enabled (scheduled). */
  isEnabled(name: string): boolean {
    return this.jobs.get(name)?.enabled ?? false
  }

  /** Returns the status of a single job, or null if not found. */
  status(name: string): CronJobStatus | null {
    const job = this.jobs.get(name)
    if (!job) return null
    return {
      name,
      enabled: job.enabled,
      running: job.instance.isRunning(),
      lastRun: job.lastRun,
      nextRun: job.instance.nextRun() ?? null,
    }
  }

  /** Returns the status of all registered jobs. */
  list(): CronJobStatus[] {
    return Array.from(this.jobs.entries()).map(([name, job]) => ({
      name,
      enabled: job.enabled,
      running: job.instance.isRunning(),
      lastRun: job.lastRun,
      nextRun: job.instance.nextRun() ?? null,
    }))
  }

  /** Permanently stop and remove all jobs. Called on server shutdown. */
  destroy(): void {
    for (const job of this.jobs.values()) job.instance.stop()
    this.jobs.clear()
  }
}

export function createCronManager(opts: CronManagerOptions = {}): CronManager {
  return new CronManager(opts)
}
