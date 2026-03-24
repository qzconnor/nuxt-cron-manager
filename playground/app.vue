<template>
  <div style="font-family: monospace; padding: 2rem; max-width: 600px;">
    <h2>nuxt-cron playground</h2>

    <div v-if="pending">Loading...</div>
    <div v-else-if="error">Error: {{ error.message }}</div>

    <table v-else style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr>
          <th style="text-align: left; padding: 6px 8px;">Name</th>
          <th style="text-align: left; padding: 6px 8px;">Enabled</th>
          <th style="text-align: left; padding: 6px 8px;">Last Run</th>
          <th style="text-align: left; padding: 6px 8px;">Next Run</th>
          <th style="text-align: left; padding: 6px 8px;">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="job in jobs" :key="job.name" style="border-top: 1px solid #ccc;">
          <td style="padding: 6px 8px;">{{ job.name }}</td>
          <td style="padding: 6px 8px;">{{ job.enabled ? '✅' : '⛔' }}</td>
          <td style="padding: 6px 8px;">{{ job.lastRun ? new Date(job.lastRun).toLocaleTimeString() : '—' }}</td>
          <td style="padding: 6px 8px;">{{ job.nextRun ? new Date(job.nextRun).toLocaleTimeString() : '—' }}</td>
          <td style="padding: 6px 8px; display: flex; gap: 4px;">
            <button :disabled="job.enabled" @click="action(job.name, 'start')">Start</button>
            <button :disabled="!job.enabled" @click="action(job.name, 'stop')">Stop</button>
            <button @click="action(job.name, 'restart')">Restart</button>
          </td>
        </tr>
      </tbody>
    </table>

    <button style="margin-top: 1rem;" @click="refresh()">Refresh</button>
  </div>
</template>

<script setup lang="ts">
const { data: jobs, pending, error, refresh } = await useFetch('/api/cron', { default: () => [] })

async function action(name: string, act: 'start' | 'stop' | 'restart') {
  await $fetch(`/api/cron/${name}`, { method: 'PATCH', body: { action: act } })
  await refresh()
}
</script>
