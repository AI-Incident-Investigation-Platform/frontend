import { Link } from 'react-router-dom'
import { paths } from '../app/navigation'

export function NotFoundPage() {
  return (
    <>
      <h1 className="page-title">404 — Page not found</h1>
      <p className="page-description">Check the address or return to Overview.</p>
      <Link className="text-link" to={paths.overview}>Back to Overview</Link>
    </>
  )
}
