import { workspaceEnvironments, type WorkspaceSettings } from '../../entities/administration'

export type WorkspaceDraft = Omit<WorkspaceSettings, 'retentionDays'> & { retentionDays: string }
export type WorkspaceErrors = Partial<Record<keyof WorkspaceDraft, string>>

export const retentionRange = { min: 1, max: 365 } as const
export const workspaceNameLimit = 80

export function workspaceDraft(settings: WorkspaceSettings): WorkspaceDraft {
  return { ...settings, retentionDays: String(settings.retentionDays) }
}

export function validateWorkspace(draft: WorkspaceDraft, projects: readonly string[]) {
  const errors: WorkspaceErrors = {}
  const workspaceName = draft.workspaceName.trim()
  if (!workspaceName) errors.workspaceName = 'Workspace name is required.'
  else if (workspaceName.length > workspaceNameLimit) errors.workspaceName = 'Use 80 characters or fewer.'
  if (!projects.includes(draft.project)) errors.project = 'Select a project from the demo workspace.'
  if (!workspaceEnvironments.includes(draft.environment)) errors.environment = 'Select a supported environment.'

  const retentionDays = Number(draft.retentionDays)
  if (!/^\d+$/.test(draft.retentionDays) || retentionDays < retentionRange.min || retentionDays > retentionRange.max) {
    errors.retentionDays = 'Enter a whole number from 1 to 365 days.'
  }

  const settings: WorkspaceSettings = { ...draft, workspaceName, retentionDays }
  return { settings, errors }
}
