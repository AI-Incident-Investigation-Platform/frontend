import { useState } from 'react'
import type { TelemetryTrace } from '../../entities/telemetry'
import { projectSpan } from '../../features/telemetry/traceQuery'
import { EmptyState, Panel } from '../../shared/ui/surfaces'

const ticks = [0, 25, 50, 75, 100]

export function TraceWaterfall({ trace }: { trace: TelemetryTrace }) {
  const [selectedSpanId, setSelectedSpanId] = useState('')
  const selected = trace.spans.find(({ spanId }) => spanId === selectedSpanId)
  const items = trace.spans.flatMap((span) => {
    const geometry = projectSpan(trace, span)
    return geometry ? [{ span, geometry }] : []
  })

  return (
    <Panel title={'Trace waterfall / ' + trace.traceId.slice(0, 8)}
      meta={items.length + ' spans · ' + trace.durationMs + ' ms'} className="trace-waterfall">
      {items.length === 0 ? <EmptyState title="No valid spans" /> : (
        <div className="waterfall-viewport" role="region" tabIndex={0} aria-label="Trace waterfall timeline">
          <div className="waterfall-canvas">
            <div className="waterfall-axis">
              <span>Service / operation</span>
              <div className="waterfall-ticks">
                {ticks.map((tick) => (
                  <span key={tick} style={{ left: tick + '%' }}>{Math.round(trace.durationMs * tick / 100)} ms</span>
                ))}
              </div>
            </div>
            <ol className="waterfall-spans">
              {items.map(({ span, geometry }) => (
                <li key={span.spanId}>
                  <button type="button" className="waterfall-span" aria-pressed={selected?.spanId === span.spanId}
                    onClick={() => setSelectedSpanId(selected?.spanId === span.spanId ? '' : span.spanId)}>
                    <span className="waterfall-label">
                      <span style={{ paddingInlineStart: geometry.depth * 12 + 'px' }}>
                        {span.serviceId} / <strong>{span.operation}</strong>
                      </span>
                      <small className={'trace-status--' + span.status}>{span.status === 'ok' ? 'OK' : 'Error'} · {span.durationMs} ms</small>
                    </span>
                    <span className="waterfall-track" aria-hidden="true">
                      <span className={`waterfall-bar waterfall-bar--${span.status}`} style={{
                        insetInlineStart: geometry.left + '%', width: geometry.width + '%',
                      }} />
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
      <p className="waterfall-scroll-hint">Scroll the timeline horizontally to see the full duration.</p>

      {selected && (
        <section className="span-record" aria-label="Selected span details">
          <h3>{selected.serviceId} / {selected.operation}</h3>
          <dl>
            <div><dt>Span ID</dt><dd><code>{selected.spanId}</code></dd></div>
            <div><dt>Parent</dt><dd><code>{selected.parentSpanId ?? 'Root span'}</code></dd></div>
            <div><dt>Offset</dt><dd>{selected.startOffsetMs} ms</dd></div>
            <div><dt>Duration</dt><dd>{selected.durationMs} ms</dd></div>
            <div><dt>Status</dt><dd className={'trace-status--' + selected.status}>{selected.status === 'ok' ? 'OK' : 'Error'}</dd></div>
          </dl>
          <p>{selected.detail}</p>
        </section>
      )}
    </Panel>
  )
}
