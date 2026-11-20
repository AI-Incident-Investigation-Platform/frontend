import { Outlet } from 'react-router-dom'
import { ProductBrand } from '../../app/ProductBrand'
import { Panel } from '../../shared/ui/surfaces'
import './auth.css'

export function AuthLayout() {
  return (
    <main className="auth-layout">
      <Panel className="auth-card">
        <ProductBrand />
        <Outlet />
      </Panel>
    </main>
  )
}
