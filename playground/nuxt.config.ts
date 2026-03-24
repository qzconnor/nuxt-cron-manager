export default defineNuxtConfig({
  modules: ['../src/module'],
  devtools: { enabled: true },
  compatibilityDate: 'latest',
  cron: {
    jobsDir: 'cron',
    timezone: 'Europe/Berlin',
  },
})
