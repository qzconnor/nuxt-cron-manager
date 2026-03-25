import type { CronJobDefinition, CronJobOptions, CronJobStatus, CronManagerOptions, CronTime } from './types.js';
export type { CronPresets, CronTime, CronJobOptions, CronJobDefinition, CronJobStatus, CronManagerOptions } from './types.js';
export declare const cronPresets: Record<string, string>;
/**
 * Define a cron job. Place this in `server/cron/*.ts`.
 *
 * @example
 * export default defineCronJob('everyMinute', async () => {
 *   console.log('tick')
 * })
 */
export declare function defineCronJob(time: CronTime, callback: () => void | Promise<void>, options?: CronJobOptions): CronJobDefinition;
export declare class CronManager {
    private jobs;
    private opts;
    constructor(opts?: CronManagerOptions);
    register(name: string, definition: CronJobDefinition): void;
    /** Enable and start a job. Returns false if the job was not found. */
    start(name: string): boolean;
    /** Disable and pause a job. Returns false if the job was not found. */
    stop(name: string): boolean;
    /** Restart a job (pause → resume). Returns false if not found. */
    restart(name: string): boolean;
    /** Start all registered jobs. */
    startAll(): void;
    /** Stop all registered jobs. */
    stopAll(): void;
    /** Returns true if the job is enabled (scheduled). */
    isEnabled(name: string): boolean;
    /** Returns the status of a single job, or null if not found. */
    status(name: string): CronJobStatus | null;
    /** Returns the status of all registered jobs. */
    list(): CronJobStatus[];
    /** Permanently stop and remove all jobs. Called on server shutdown. */
    destroy(): void;
}
export declare function createCronManager(opts?: CronManagerOptions): CronManager;
