export type IntegrationProvider = 'elasticsearch' | 'prometheus' | 'tempo' | 'github' | 'docker' | 'deployments'
export type IntegrationStatus = 'connected' | 'disconnected' | 'limited' | 'error'
export type IntegrationField = 'endpoint' | 'indexPattern' | 'job' | 'tenant' | 'repository' | 'branch' | 'scope' | 'eventSource'

export type IntegrationValues = Partial<Record<IntegrationField, string>>

export interface Integration {
  id: string
  provider: IntegrationProvider
  status: IntegrationStatus
  values: IntegrationValues
}

export const demoRoles = {
  admin: { label: 'Admin', description: 'Edit workspace configuration and review demo RCA reports.' },
  developer: { label: 'Developer', description: 'Use investigation controls and view workspace configuration.' },
  viewer: { label: 'Viewer', description: 'Read-only access to incidents and workspace configuration.' },
} as const

export type DemoRole = keyof typeof demoRoles

export function readDemoRole(value: string | null, fallback: DemoRole): DemoRole {
  return value === 'admin' || value === 'developer' || value === 'viewer' ? value : fallback
}

export const workspaceEnvironments = ['Production', 'Staging', 'Development'] as const

export interface WorkspaceSettings {
  workspaceName: string
  project: string
  environment: typeof workspaceEnvironments[number]
  retentionDays: number
}
