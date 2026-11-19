import { EmptyState, Panel } from '../shared/ui/surfaces'

export function PlaceholderPage({ title, story }: { title: string; story: string }) {
  return (
    <>
      <h1 className="page-title">{title}</h1>
      <Panel className="route-placeholder">
        <EmptyState title="Screen pending" description={`This screen is scheduled for ${story}.`} />
      </Panel>
    </>
  )
}
