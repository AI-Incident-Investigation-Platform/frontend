import type { InvestigationRun, ToolEvent } from '../../entities/investigation'

export type RunActivity = {
  run: InvestigationRun
  events: readonly ToolEvent[]
  completedAt?: string
}

export function projectRunActivity(activity: RunActivity, delivered: readonly ToolEvent[] = []): RunActivity {
  const { run } = activity
  const eventsById = new Map<string, ToolEvent>()

  for (const event of [...activity.events, ...delivered]) {
    if (event.runId !== run.runId) continue
    const previous = eventsById.get(event.eventId)
    if (!previous || Date.parse(event.timestamp) >= Date.parse(previous.timestamp)) {
      eventsById.set(event.eventId, event)
    }
  }

  const totalSteps = Number.isFinite(run.totalSteps) ? Math.max(0, Math.trunc(run.totalSteps)) : 0
  const reportedStep = Number.isFinite(run.currentStep) ? Math.trunc(run.currentStep) : 0

  return {
    ...activity,
    run: { ...run, totalSteps, currentStep: Math.min(totalSteps, Math.max(0, reportedStep)) },
    events: [...eventsById.values()].sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp)),
  }
}

export function summarizeRuns(activities: readonly RunActivity[], snapshotAt: string) {
  const end = Date.parse(snapshotAt)
  const start = end - 24 * 60 * 60 * 1000
  const counts = { running: 0, awaitingReview: 0, completed24h: 0 }

  for (const { run, completedAt } of activities) {
    if (run.status === 'running') counts.running += 1
    if (run.status === 'awaiting-review') counts.awaitingReview += 1
    if (run.status === 'completed' && completedAt) {
      const completed = Date.parse(completedAt)
      if (completed >= start && completed <= end) counts.completed24h += 1
    }
  }

  return counts
}

export function formatToolDuration(ms: number | null) {
  if (ms === null) return null
  return ms < 1000 ? ms + ' ms' : Number((ms / 1000).toFixed(2)) + ' s'
}
