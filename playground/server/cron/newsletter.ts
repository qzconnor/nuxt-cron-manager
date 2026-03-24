export default defineCronJob('0 8 * * *', async () => {
  console.log('[cron:newsletter] Sending daily newsletter...')
  // await sendNewsletter()
}, { enabled: false, timezone: 'Europe/Berlin' })
