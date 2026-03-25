export type CronPresets = 'everySecond' | 'everyFiveSeconds' | 'everyTenSeconds' | 'everyThirtySeconds' | 'everyMinute' | 'everyFiveMinutes' | 'everyTenMinutes' | 'everyThirtyMinutes' | 'everyHour' | 'everyTwoHours' | 'everySixHours' | 'everyTwelveHours' | 'daily' | 'weekly' | 'monthly' | 'yearly';
export type CronTime = CronPresets | (string & {}) | (() => string);
export interface CronJobOptions {
    /**
     * Whether the job starts enabled.
     * @default true
     */
    enabled?: boolean;
    /**
     * Run the job immediately upon registration.
     * @default false
     */
    runOnInit?: boolean;
    /**
     * IANA timezone string (e.g. 'Europe/Berlin').
     * Falls back to the module-level timezone option.
     */
    timezone?: string;
}
export interface CronJobDefinition {
    /** Cron expression, preset name, or function returning an expression. */
    time: CronTime;
    /** The function to execute. */
    run: () => void | Promise<void>;
    options?: CronJobOptions;
}
export interface CronJobStatus {
    name: string;
    /** Job is enabled (not paused, not permanently stopped). */
    enabled: boolean;
    /**
     * True while the job's callback is actively executing.
     * False in between runs (scheduled but idle) or when paused.
     */
    running: boolean;
    lastRun: Date | null;
    nextRun: Date | null;
}
export interface CronManagerOptions {
    /** Default IANA timezone for all jobs. */
    timezone?: string;
}
