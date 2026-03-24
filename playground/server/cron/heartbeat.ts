export default defineCronJob('everyTenSeconds', () => {
  console.log('[cron:heartbeat] tick —', new Date().toISOString())
}, { runOnInit: true })
