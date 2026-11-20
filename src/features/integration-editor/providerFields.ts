import type { IntegrationField, IntegrationProvider, IntegrationValues } from '../../entities/administration'

type ProviderField = {
  key: IntegrationField
  label: string
  placeholder: string
}

type ProviderDefinition = {
  name: string
  monogram: string
  description: string
  fields: readonly [ProviderField, ...ProviderField[]]
}

export const integrationProviders: Record<IntegrationProvider, ProviderDefinition> = {
  elasticsearch: {
    name: 'Elasticsearch', monogram: 'EL', description: 'Application logs, stack traces, correlation IDs',
    fields: [
      { key: 'endpoint', label: 'Endpoint URL', placeholder: 'https://logs.example:9200' },
      { key: 'indexPattern', label: 'Index pattern', placeholder: 'checkout-logs-*' },
    ],
  },
  prometheus: {
    name: 'Prometheus', monogram: 'PR', description: 'Metrics, alerts and PromQL diagnostics',
    fields: [
      { key: 'endpoint', label: 'Endpoint URL', placeholder: 'https://metrics.example' },
      { key: 'job', label: 'Scrape job', placeholder: 'payment-service' },
    ],
  },
  tempo: {
    name: 'Grafana Tempo', monogram: 'GT', description: 'Distributed traces and span details',
    fields: [
      { key: 'endpoint', label: 'Endpoint URL', placeholder: 'https://tempo.example' },
      { key: 'tenant', label: 'Tenant', placeholder: 'checkout-demo' },
    ],
  },
  github: {
    name: 'GitHub', monogram: 'GH', description: 'Repository code, commits and diffs',
    fields: [
      { key: 'repository', label: 'Repository', placeholder: 'owner/repository' },
      { key: 'branch', label: 'Default branch', placeholder: 'main' },
    ],
  },
  docker: {
    name: 'Docker diagnostics', monogram: 'DO', description: 'Container state, restart counts and OOM events',
    fields: [{ key: 'scope', label: 'Read-only container scope', placeholder: 'checkout' }],
  },
  deployments: {
    name: 'Deployment API', monogram: 'DE', description: 'External deployment events',
    fields: [
      { key: 'endpoint', label: 'Endpoint URL', placeholder: 'https://deployments.example/deployments' },
      { key: 'eventSource', label: 'Event source', placeholder: 'deployment-events' },
    ],
  },
}

export const providerIds = Object.keys(integrationProviders) as IntegrationProvider[]
export const endpointError = 'Enter an HTTP or HTTPS URL without credentials, query parameters or a fragment.'

function validEndpoint(text: string) {
  if (!/^https?:\/\//i.test(text) || /[\s\\?#]/.test(text)) return false
  try {
    const url = new URL(text)
    return Boolean(url.hostname) && !url.username && !url.password
  } catch {
    return false
  }
}

export function validateIntegration(provider: IntegrationProvider, draft: IntegrationValues) {
  const values: IntegrationValues = {}
  const errors: IntegrationValues = {}

  for (const { key, label } of integrationProviders[provider].fields) {
    const text = draft[key]?.trim() ?? ''
    if (!text) {
      errors[key] = label + ' is required.'
    } else if (key === 'endpoint' && !validEndpoint(text)) {
      errors[key] = endpointError
    } else if (key === 'repository' && !/^[a-z0-9_.-]+\/[a-z0-9_.-]+$/i.test(text)) {
      errors[key] = 'Enter a repository in owner/repository format.'
    } else {
      const maxLength = key === 'endpoint' ? 1024 : 120
      if (text.length > maxLength) errors[key] = 'Use ' + maxLength + ' characters or fewer.'
      else values[key] = text
    }
  }
  return { values, errors }
}
