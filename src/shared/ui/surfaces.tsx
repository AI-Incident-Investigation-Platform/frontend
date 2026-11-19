import { useId, type ReactNode } from 'react'

type PanelProps = {
  children: ReactNode
  title?: string
  className?: string
}

export function Panel({ children, title, className = '' }: PanelProps) {
  const classes = `panel ${className}`.trim()
  const titleId = useId()

  if (!title) return <div className={classes}>{children}</div>

  return (
    <section className={classes} aria-labelledby={titleId}>
      <h2 className="panel__title" id={titleId}>{title}</h2>
      {children}
    </section>
  )
}

type MetricCardProps = {
  label: string
  value: string | number
  hint?: string
  tone?: 'neutral' | 'info' | 'success' | 'warning' | 'danger'
}

export function MetricCard({ label, value, hint, tone = 'neutral' }: MetricCardProps) {
  return (
    <dl className="panel metric">
      <dt>{label}</dt>
      <dd className="metric__value">{value}</dd>
      {hint && <dd className={`metric__hint tone--${tone}`}>{hint}</dd>}
    </dl>
  )
}

export function DataTable({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="table-viewport" tabIndex={0} role="region" aria-label={label}>
      <table className="data-table" aria-label={label}>{children}</table>
    </div>
  )
}

type StateProps = { title: string; description?: string; action?: ReactNode }

export function EmptyState({ title, description, action }: StateProps) {
  return (
    <div className="state">
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      {action && <div className="state__action">{action}</div>}
    </div>
  )
}

export function LoadingState({ title = 'Loading…' }: { title?: string }) {
  return <div className="state" role="status">{title}</div>
}

export function ErrorState({ title, description, action }: StateProps) {
  return (
    <div className="state state--error">
      <div role="alert">
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action && <div className="state__action">{action}</div>}
    </div>
  )
}
