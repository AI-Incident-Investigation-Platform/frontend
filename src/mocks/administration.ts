import type { Integration, WorkspaceSettings } from '../entities/administration'
import { demoWorkspace, paymentRun, paymentService } from './investigation'
import { getDemoIncidents } from './incidents'

const integrations: readonly Integration[] = [
  { id: 'es-demo', provider: 'elasticsearch', status: 'connected',
    values: { endpoint: 'https://logs.example:9200', indexPattern: 'checkout-logs-*' } },
  { id: 'prom-demo', provider: 'prometheus', status: 'connected',
    values: { endpoint: 'https://metrics.example', job: paymentService.serviceId } },
  { id: 'tempo-demo', provider: 'tempo', status: 'connected',
    values: { endpoint: 'https://tempo.example', tenant: 'checkout-demo' } },
  { id: 'gh-demo', provider: 'github', status: 'connected',
    values: { repository: 'acme-demo/ecommerce-backend', branch: 'main' } },
  { id: 'docker-demo', provider: 'docker', status: 'limited', values: { scope: 'checkout' } },
  { id: 'deploy-demo', provider: 'deployments', status: 'error',
    values: { endpoint: 'https://deployments.example/deployments', eventSource: 'deployment-events' } },
]

export const integrationDemos = {
  default: integrations,
  empty: [],
  long: integrations.map((integration): Integration => integration.provider === 'elasticsearch' ? {
    ...integration,
    values: { ...integration.values, endpoint: 'https://logs.example:9200/checkout-' + 'regional-observability-partition-'.repeat(12) + 'archive' },
  } : integration),
} satisfies Record<string, readonly Integration[]>

export type IntegrationDemo = keyof typeof integrationDemos
export type IntegrationSessions = Record<IntegrationDemo, readonly Integration[]>

export const defaultWorkspaceSettings: WorkspaceSettings = {
  workspaceName: 'SRE Platform',
  project: 'E-commerce',
  environment: demoWorkspace.environment,
  retentionDays: 90,
}

export const workspaceProjects = [...new Set(getDemoIncidents(null).map(({ project }) => project))].sort()

export const investigationLimits = { timeoutMinutes: 20, maxToolCalls: 40, maxSteps: paymentRun.totalSteps } as const
export const demoRuntime = { engine: 'llama.cpp', model: 'Qwen2.5-Coder-7B-Instruct', access: 'Read-only tools' } as const
