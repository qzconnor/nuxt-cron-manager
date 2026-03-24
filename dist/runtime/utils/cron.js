import { useNitroApp } from "nitropack/runtime";
export function useCron() {
  const app = useNitroApp();
  if (!app.cronManager) {
    throw new Error(
      "[nuxt-cron] CronManager is not initialized. Make sure the nuxt-cron module is loaded and job files exist in server/cron/."
    );
  }
  return app.cronManager;
}
