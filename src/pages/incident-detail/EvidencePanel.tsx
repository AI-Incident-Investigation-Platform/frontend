import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import type { Evidence, Hypothesis } from '../../entities/investigation'
import { EmptyState, Panel } from '../../shared/ui/surfaces'
import { CaseTime, evidenceLabels, type EvidenceHref } from './presentation'

type Props = {
  evidence: readonly Evidence[]
  hypotheses: readonly Hypothesis[]
  selectedId: string | null
  href: EvidenceHref
}

function EvidenceDetail({ item, hypotheses }: { item: Evidence; hypotheses: readonly Hypothesis[] }) {
  const detail = useRef<HTMLElement>(null)
  const { source } = item
  const sourceId = source.kind === 'trace' ? source.traceId : source.eventId

  useEffect(() => {
    detail.current?.focus()
  }, [item.evidenceId])

  return (
    <section ref={detail} className="detail-evidence-focus" tabIndex={-1} data-evidence-detail>
      <Panel title="Evidence details" meta={evidenceLabels[source.kind]}>
        <div className="detail-pad">
          <h3><code>{item.evidenceId}</code></h3>
          <p>{item.summary}</p>
          <dl className="detail-fields">
            <div><dt>Source record</dt><dd><code>{sourceId}</code></dd></div>
            <div><dt>Captured</dt><dd><CaseTime at={item.timestamp} precise /></dd></div>
            <div>
              <dt>Linked hypotheses</dt>
              <dd>{hypotheses.map(({ title }) => title).join(' · ') || 'Unassigned'}</dd>
            </div>
          </dl>
          <details className="detail-excerpt" key={item.evidenceId}>
            <summary>Source excerpt</summary>
            <pre tabIndex={0} aria-label="Evidence source excerpt">{item.excerpt}</pre>
          </details>
        </div>
      </Panel>
    </section>
  )
}

export function EvidencePanel({ evidence, hypotheses, selectedId, href }: Props) {
  if (evidence.length === 0) {
    return <Panel title="Evidence"><EmptyState title="No evidence collected" /></Panel>
  }

  const selected = evidence.find(({ evidenceId }) => evidenceId === selectedId)

  return (
    <div className={selectedId ? 'detail-columns detail-evidence-columns' : undefined}>
      <Panel title="Evidence" meta={evidence.length + ' records'}>
        <ul className="detail-rows">
          {evidence.map((item) => {
            const linked = hypotheses.filter(({ evidenceIds }) => evidenceIds.includes(item.evidenceId))
            return (
              <li key={item.evidenceId} className={selected?.evidenceId === item.evidenceId ? 'detail-selected' : undefined}>
                <div className="detail-row-heading">
                  <Link className="text-link" to={href(item.evidenceId)} aria-current={selected?.evidenceId === item.evidenceId}>
                    <code>{item.evidenceId}</code> · {evidenceLabels[item.source.kind]}
                  </Link>
                  <CaseTime at={item.timestamp} precise />
                </div>
                <p>{item.summary}</p>
                <p className="detail-muted">{linked.map(({ title }) => title).join(' · ') || 'Unassigned'}</p>
              </li>
            )
          })}
        </ul>
      </Panel>
      {selected && <EvidenceDetail item={selected}
        hypotheses={hypotheses.filter(({ evidenceIds }) => evidenceIds.includes(selected.evidenceId))} />}
      {selectedId && !selected && (
        <Panel title="Evidence details"><EmptyState title="Evidence unavailable" description="Choose a record from this incident." /></Panel>
      )}
    </div>
  )
}
