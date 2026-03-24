import {
  defineNuxtModule,
  createResolver,
  addServerImports,
  addServerPlugin,
} from '@nuxt/kit'
import { join } from 'pathe'
import fg from 'fast-glob'
import type { CronManagerOptions } from './runtime/types'

export interface ModuleOptions extends CronManagerOptions {
  /**
   * Directory for cron job files, relative to the server directory.
   * Resolved as `<rootDir>/server/<jobsDir>/`.
   * @default 'cron'
   */
  jobsDir?: string
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-cron',
    configKey: 'cron',
  },
  defaults: {
    jobsDir: 'cron',
    timezone: undefined,
  },
  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)
    const jobsDir = join(nuxt.options.serverDir, options.jobsDir ?? 'cron')

    // ------------------------------------------------------------------
    // Discover job files
    // ------------------------------------------------------------------
    const jobFiles = await fg(['**/*.{ts,js,mjs}'], {
      cwd: jobsDir,
      absolute: true,
      ignore: ['**/*.d.ts'],
    })

    const jobs = jobFiles.map((filePath) => {
      const relative = filePath
        .replace(jobsDir, '')
        .replace(/^[\\/]/, '')
        .replace(/\.(ts|js|mjs)$/, '')
      const name = relative.replace(/[\\/]/g, '-')
      const variableName = `_job_${name.replace(/[^a-z0-9]/gi, '_')}`
      // Normalize to forward slashes for Rollup imports
      const normalizedPath = filePath.replace(/\\/g, '/')
      return { name, filePath: normalizedPath, variableName }
    })

    const runtimeServerPath = resolver.resolve('./runtime/server').replace(/\\/g, '/')

    // ------------------------------------------------------------------
    // Configure Nitro
    // ------------------------------------------------------------------
    nuxt.hook('nitro:config', (nitroConfig) => {
      // Inline croner so Nitro bundles it (not treated as external)
      nitroConfig.externals = nitroConfig.externals ?? {}
      nitroConfig.externals.inline = [
        ...(nitroConfig.externals.inline ?? []),
        'croner',
      ]

      // #nuxt-cron alias for job files
      nitroConfig.alias = nitroConfig.alias ?? {}
      nitroConfig.alias['#nuxt-cron'] = runtimeServerPath

      // Virtual module: provides the job registry to the plugin
      // This is processed by Rollup with TypeScript support, so .ts imports work.
      nitroConfig.virtual = nitroConfig.virtual ?? {}
      nitroConfig.virtual['#nuxt-cron-jobs'] = buildJobsVirtualModule(jobs, options)
    })

    // ------------------------------------------------------------------
    // Register the TypeScript server plugin (Nitro/Rollup will transpile it)
    // ------------------------------------------------------------------
    addServerPlugin(resolver.resolve('./runtime/plugins/cron'))

    // ------------------------------------------------------------------
    // Auto-imports for server context
    // ------------------------------------------------------------------
    addServerImports([
      {
        name: 'useCron',
        as: 'useCron',
        from: resolver.resolve('./runtime/utils/cron'),
      },
      {
        name: 'defineCronJob',
        as: 'defineCronJob',
        from: runtimeServerPath,
      },
    ])
  },
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface JobEntry {
  name: string
  filePath: string
  variableName: string
}

function buildJobsVirtualModule(jobs: JobEntry[], options: ModuleOptions): string {
  const imports = jobs
    .map(j => `import ${j.variableName} from '${j.filePath}'`)
    .join('\n')

  const jobsObject = jobs
    .map(j => `  '${j.name}': ${j.variableName}`)
    .join(',\n')

  return `${imports}

export const __cronJobs = {
${jobsObject}
}

export const __cronOptions = ${JSON.stringify({ timezone: options.timezone })}
`
}
