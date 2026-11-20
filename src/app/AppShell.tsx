import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { demoWorkspace } from '../mocks/investigation'
import { Button } from '../shared/ui/controls'
import { navigationGroups, paths } from './navigation'
import { ProductBrand } from './ProductBrand'
import './shell.css'

const compactViewport = '(max-width: 768px)'
const snapshotDate = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
}).format(new Date(demoWorkspace.snapshotAt))

function SidebarNavigation({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="shell-nav" aria-label="Primary">
      <div className="shell-nav__label" aria-hidden="true">Explore</div>
      {navigationGroups.map(({ label, items }) => (
        <ul className="shell-nav__group" aria-label={label} key={label}>
          {items.map((item) => (
            <li key={item.path}>
              <NavLink to={item.path} end={item.path !== paths.incidents} onClick={onNavigate}>
                <span className="shell-nav__dot" aria-hidden="true" />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      ))}
    </nav>
  )
}

export function AppShell() {
  const { pathname } = useLocation()
  const previousPath = useRef(pathname)
  const main = useRef<HTMLElement>(null)
  const drawer = useRef<HTMLDialogElement>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    if (previousPath.current !== pathname) {
      previousPath.current = pathname
      main.current?.focus()
    }
  }, [pathname])

  useEffect(() => {
    const viewport = window.matchMedia(compactViewport)
    function closeOnDesktop(event: MediaQueryListEvent) {
      if (!event.matches && drawer.current?.open) {
        drawer.current.close()
        main.current?.focus()
      }
    }
    viewport.addEventListener('change', closeOnDesktop)
    return () => viewport.removeEventListener('change', closeOnDesktop)
  }, [])

  function openDrawer() {
    drawer.current?.showModal()
    setDrawerOpen(true)
  }

  function closeDrawer() {
    drawer.current?.close()
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <aside className="shell-sidebar">
        <ProductBrand />
        <SidebarNavigation />
      </aside>
      <header className="shell-header">
        <div className="shell-header__context">
          <Button
            className="shell-menu"
            aria-controls="navigation-drawer"
            aria-expanded={drawerOpen}
            aria-haspopup="dialog"
            onClick={openDrawer}
          >
            <span className="shell-menu__icon" aria-hidden="true" />
            <span className="visually-hidden">Open navigation</span>
          </Button>
          <span className="shell-workspace">
            {demoWorkspace.name} <span aria-hidden="true">/</span> {demoWorkspace.project}
          </span>
        </div>
        <div className="shell-header__environment">
          <Link className="shell-demo shell-demo-login" to={paths.login}>Demo sign-in</Link>
          <span className="shell-production">{demoWorkspace.environment}</span>
          <time className="shell-date" dateTime={demoWorkspace.snapshotAt}>{snapshotDate}</time>
        </div>
      </header>
      <main className="shell-main" id="main-content" ref={main} tabIndex={-1}>
        <Outlet />
      </main>
      <dialog
        className="shell-drawer"
        id="navigation-drawer"
        aria-label="Navigation menu"
        ref={drawer}
        onClose={() => setDrawerOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeDrawer()
        }}
      >
        <div className="shell-drawer__body">
          <div className="shell-drawer__header">
            <ProductBrand />
            <Button onClick={closeDrawer}>Close</Button>
          </div>
          <SidebarNavigation onNavigate={closeDrawer} />
        </div>
      </dialog>
    </div>
  )
}
