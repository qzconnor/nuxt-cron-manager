import { defineNitroPlugin } from "nitropack/runtime";
import { createCronManager } from "../server.js";
import { __cronJobs, __cronOptions } from "#nuxt-cron-jobs";
export default defineNitroPlugin((nitroApp) => {
  const manager = createCronManager(__cronOptions);
  for (const [name, definition] of Object.entries(__cronJobs)) {
    manager.register(name, definition);
  }
  nitroApp.cronManager = manager;
  const count = Object.keys(__cronJobs).length;
  const names = Object.keys(__cronJobs).join(", ");
  console.info(`[nuxt-cron] ${count} job(s) registered${names ? ": " + names : ""}`);
  nitroApp.hooks.hookOnce("close", () => {
    manager.destroy();
  });
});
