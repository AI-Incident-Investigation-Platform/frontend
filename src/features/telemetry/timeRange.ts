export const telemetryRanges = [
  [1, 'Last 1 hour'],
  [6, 'Last 6 hours'],
  [24, 'Last 24 hours'],
] as const

export type TelemetryHours = typeof telemetryRanges[number][0]

export function readTelemetryHours(value: string, fallback: TelemetryHours): TelemetryHours {
  return telemetryRanges.find(([hours]) => String(hours) === value)?.[0] ?? fallback
}

export function isInSnapshotRange(timestamp: string, hours: TelemetryHours, snapshotAt: string) {
  const at = Date.parse(timestamp)
  const end = Date.parse(snapshotAt)
  return at <= end && at >= end - hours * 3_600_000
}
