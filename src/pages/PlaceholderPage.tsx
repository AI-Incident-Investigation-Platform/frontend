import { useParams } from 'react-router-dom'
import { paymentIncident } from '../mocks/investigation'
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

export function IncidentPlaceholderPage() {
  const { incidentId } = useParams()
  const title = incidentId === paymentIncident.incidentId
    ? `${incidentId} / ${paymentIncident.serviceId}`
    : incidentId ?? 'Incident detail'

  return <PlaceholderPage title={title} story="FE-04" />
}
