import { describe, expect, it } from 'vitest'
import type { ToolEvent } from '../../entities/investigation'
import { paymentRun } from '../../mocks/investigation'
import { projectRunActivity, summarizeRuns } from './projectRuns'

const event: ToolEvent = {
  runId: paymentRun.runId, eventId: 'example', tool: 'search_logs', status: 'running',
  timestamp: '2026-10-16T14:36:00Z', durationMs: null, summary: 'Collecting logs.',
}

describe('projectRunActivity', () => {
  it('bounds progress and orders streams without duplicates or events for other runs', () => {
    const newer: ToolEvent = {
      ...event, status: 'completed', timestamp: '2026-10-16T14:36:02Z', durationMs: 2000, summary: 'Logs collected.',
    }
    const first = { ...event, eventId: 'first', timestamp: '2026-10-16T14:35:59Z' }
    const foreign = { ...event, eventId: 'foreign', runId: 'another-run' }
    const activity = projectRunActivity({
      run: { ...paymentRun, currentStep: 21 }, events: [event, first, foreign],
    }, [newer, event])
    expect(activity.run.currentStep).toBe(20)
    expect(activity.events).toEqual([first, newer])
  })

  it('shows zero steps for a pending run without a tool event', () => {
    const activity = projectRunActivity({ run: { ...paymentRun, status: 'pending', currentStep: 0 }, events: [] })
    expect(activity.run.currentStep).toBe(0)
    expect(activity.events).toEqual([])
  })
})

describe('summarizeRuns', () => {
  it('counts review separately and only includes completions within the last 24 hours', () => {
    const metrics = summarizeRuns([
      { run: paymentRun, events: [] },
      { run: { ...paymentRun, runId: 'review', status: 'awaiting-review' }, events: [] },
      { run: { ...paymentRun, runId: 'old', status: 'completed' }, events: [], completedAt: '2026-10-15T14:39:59Z' },
      { run: { ...paymentRun, runId: 'recent', status: 'completed' }, events: [], completedAt: '2026-10-15T14:40:00Z' },
      { run: { ...paymentRun, runId: 'future', status: 'completed' }, events: [], completedAt: '2026-10-16T14:40:01Z' },
    ], '2026-10-16T14:40:00Z')
    expect(metrics).toEqual({ running: 1, awaitingReview: 1, completed24h: 1 })
  })
})
