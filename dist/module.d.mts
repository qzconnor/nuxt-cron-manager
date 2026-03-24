import * as _nuxt_schema from '@nuxt/schema';
import { CronManagerOptions } from '../dist/runtime/types.js';

interface ModuleOptions extends CronManagerOptions {
    /**
     * Directory for cron job files, relative to the server directory.
     * Resolved as `<rootDir>/server/<jobsDir>/`.
     * @default 'cron'
     */
    jobsDir?: string;
}
declare const _default: _nuxt_schema.NuxtModule<ModuleOptions, ModuleOptions, false>;

export { _default as default };
export type { ModuleOptions };
