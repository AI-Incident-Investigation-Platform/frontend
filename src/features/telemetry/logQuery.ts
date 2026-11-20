import type { LogEntry, LogLevel } from '../../entities/telemetry'
import { isInSnapshotRange, type TelemetryHours } from './timeRange'

type LogQuery = {
  service?: string
  level?: LogLevel
  keyword?: string
}

const term = /(?:^|\s+)(service|level|keyword):(?:"([^"\r\n]+)"|([^\s":]+))(?=\s|$)/gi

export function parseLogQuery(text: string): LogQuery | null {
  if (text.replace(term, '').trim()) return null

  const terms = new Map<string, string>()
  for (const [, rawKey, quoted, bare] of text.matchAll(term)) {
    const key = rawKey.toLowerCase()
    const value = (quoted ?? bare).trim()
    if (!value || terms.has(key)) return null
    terms.set(key, value)
  }

  const query: LogQuery = {}
  const service = terms.get('service')?.toLowerCase()
  const level = terms.get('level')?.toUpperCase()
  const keyword = terms.get('keyword')?.toLowerCase()
  if (service) {
    if (!/^[a-z0-9-]+$/.test(service)) return null
    query.service = service
  }
  if (level) {
    if (level !== 'ERROR' && level !== 'WARN' && level !== 'INFO') return null
    query.level = level
  }
  if (keyword) query.keyword = keyword
  return query
}

export function filterLogs(logs: readonly LogEntry[], query: LogQuery, hours: TelemetryHours, snapshotAt: string) {
  return logs.filter((entry) =>
    (!query.service || query.service === entry.serviceId) &&
    (!query.level || query.level === entry.level) &&
    (!query.keyword || entry.message.toLowerCase().includes(query.keyword)) &&
    isInSnapshotRange(entry.timestamp, hours, snapshotAt),
  ).sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
}
