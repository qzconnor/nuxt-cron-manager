export default defineCronJob('0 8 * * *', async (test: string) => {
  console.log('[cron:newsletter] Sending daily newsletter...')
  // await sendNewsletter()
  console.log(test)
}, { enabled: false, timezone: 'Europe/Berlin' })
