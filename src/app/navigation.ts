export const paths = {
  overview: '/overview',
  incidents: '/incidents',
  incidentDetail: '/incidents/:incidentId',
  investigations: '/investigations',
  serviceMap: '/service-map',
  logsMetrics: '/logs-metrics',
  traces: '/traces',
  integrations: '/integrations',
  settings: '/settings',
} as const

type NavigationItem = {
  path: string
  label: string
  title: string
  story: string
}

export const navigationGroups: ReadonlyArray<{ label: string; items: readonly NavigationItem[] }> = [
  {
    label: 'Explore',
    items: [
      { path: paths.overview, label: 'Overview', title: 'Service observability', story: 'FE-02' },
      { path: paths.incidents, label: 'Incidents', title: 'Incidents', story: 'FE-03' },
      { path: paths.investigations, label: 'Live investigations', title: 'Live investigations', story: 'FE-05' },
      { path: paths.serviceMap, label: 'Service map', title: 'Service map', story: 'FE-06' },
      { path: paths.logsMetrics, label: 'Logs & metrics', title: 'Logs & metrics', story: 'FE-06' },
      { path: paths.traces, label: 'Traces', title: 'Traces', story: 'FE-06' },
    ],
  },
  {
    label: 'Administration',
    items: [
      { path: paths.integrations, label: 'Integrations', title: 'Integrations', story: 'FE-07' },
      { path: paths.settings, label: 'Settings', title: 'Settings', story: 'FE-07' },
    ],
  },
]
