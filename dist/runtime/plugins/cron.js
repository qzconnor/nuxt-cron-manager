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
  const info = "\x1B[96m\u2139\x1B[0m";
  console.info(`${info} Nuxt Cron Manager registered ${count} job(s)${names ? ": " + names : ""}`);
  nitroApp.hooks.hookOnce("close", () => {
    manager.destroy();
  });
});
