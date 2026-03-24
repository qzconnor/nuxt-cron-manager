import { defineNuxtModule, createResolver, addServerPlugin, addServerImports } from '@nuxt/kit';
import { join } from 'pathe';
import fg from 'fast-glob';

const module$1 = defineNuxtModule({
  meta: {
    name: "nuxt-cron",
    configKey: "cron"
  },
  defaults: {
    jobsDir: "cron",
    timezone: void 0
  },
  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url);
    const jobsDir = join(nuxt.options.serverDir, options.jobsDir ?? "cron");
    const jobFiles = await fg(["**/*.{ts,js,mjs}"], {
      cwd: jobsDir,
      absolute: true,
      ignore: ["**/*.d.ts"]
    });
    const jobs = jobFiles.map((filePath) => {
      const relative = filePath.replace(jobsDir, "").replace(/^[\\/]/, "").replace(/\.(ts|js|mjs)$/, "");
      const name = relative.replace(/[\\/]/g, "-");
      const variableName = `_job_${name.replace(/[^a-z0-9]/gi, "_")}`;
      const normalizedPath = filePath.replace(/\\/g, "/");
      return { name, filePath: normalizedPath, variableName };
    });
    const runtimeServerPath = resolver.resolve("./runtime/server").replace(/\\/g, "/");
    nuxt.hook("nitro:config", (nitroConfig) => {
      nitroConfig.externals = nitroConfig.externals ?? {};
      nitroConfig.externals.inline = [
        ...nitroConfig.externals.inline ?? [],
        "croner"
      ];
      nitroConfig.alias = nitroConfig.alias ?? {};
      nitroConfig.alias["#nuxt-cron"] = runtimeServerPath;
      nitroConfig.virtual = nitroConfig.virtual ?? {};
      nitroConfig.virtual["#nuxt-cron-jobs"] = buildJobsVirtualModule(jobs, options);
    });
    addServerPlugin(resolver.resolve("./runtime/plugins/cron"));
    addServerImports([
      {
        name: "useCron",
        as: "useCron",
        from: resolver.resolve("./runtime/utils/cron")
      },
      {
        name: "defineCronJob",
        as: "defineCronJob",
        from: runtimeServerPath
      }
    ]);
  }
});
function buildJobsVirtualModule(jobs, options) {
  const imports = jobs.map((j) => `import ${j.variableName} from '${j.filePath}'`).join("\n");
  const jobsObject = jobs.map((j) => `  '${j.name}': ${j.variableName}`).join(",\n");
  return `${imports}

export const __cronJobs = {
${jobsObject}
}

export const __cronOptions = ${JSON.stringify({ timezone: options.timezone })}
`;
}

export { module$1 as default };
