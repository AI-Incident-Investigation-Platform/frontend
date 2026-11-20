import { useState } from 'react'
import { Link } from 'react-router-dom'
import { paths } from '../../app/navigation'
import type { LogEntry } from '../../entities/telemetry'
import { Button } from '../../shared/ui/controls'

export function LogRecord({ entry }: { entry: LogEntry }) {
  const [copyStatus, setCopyStatus] = useState('')
  const timestamp = new Date(entry.timestamp).toISOString()
  const excerpt = entry.excerpt ?? [timestamp, entry.level, entry.serviceId, entry.message].join(' ')

  async function copyExcerpt() {
    try {
      await navigator.clipboard.writeText(excerpt)
      setCopyStatus('Excerpt copied.')
    } catch {
      setCopyStatus('Copy unavailable. Select the excerpt to copy it.')
    }
  }

  return (
    <li className="log-row">
      <details>
        <summary>
          <time dateTime={entry.timestamp} title={timestamp}>{timestamp.slice(11, 23)} UTC</time>
          <span className={'log-level log-level--' + entry.level.toLowerCase()}>{entry.level}</span>
          <span className="log-row__text"><strong>{entry.serviceId}</strong><span>{entry.message}</span></span>
          <span className="log-row__expand" aria-hidden="true" />
        </summary>
        <div className="log-record">
          <dl aria-label="Log metadata">
            {Object.entries(entry.metadata).map(([name, value]) => (
              <div key={name}><dt>{name}</dt><dd><code>{value}</code></dd></div>
            ))}
          </dl>
          <pre tabIndex={0} aria-label="Log excerpt">{excerpt}</pre>
          <div className="log-actions">
            <Button onClick={copyExcerpt}>Copy log excerpt</Button>
            {entry.traceId && <Link className="text-link" to={paths.traces + '?' + new URLSearchParams({ traceId: entry.traceId })}>
              Open trace
            </Link>}
            <span role="status">{copyStatus}</span>
          </div>
        </div>
      </details>
    </li>
  )
}
