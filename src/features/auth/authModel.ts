export type LoginInput = { email: string; password: string }
export type LoginErrors = Partial<Record<keyof LoginInput, string>>

export interface AuthChallenge {
  readonly maskedEmail: string
  readonly developmentCode: string
  readonly expiresAt: number
  readonly resendAvailableAt: number
  readonly attemptsRemaining: number
}

type NetworkError = { status: 'network-error' }
type ChallengeIssued = { status: 'challenge'; challenge: AuthChallenge }
type ChallengeRejected = { status: 'invalid' | 'expired' | 'locked'; challenge: AuthChallenge }

export interface AuthAdapter {
  login(input: LoginInput): Promise<ChallengeIssued | NetworkError | { status: 'invalid'; errors: LoginErrors }>
  verifyOtp(challenge: AuthChallenge, code: string): Promise<{ status: 'verified' } | ChallengeRejected | NetworkError>
  resendOtp(challenge: AuthChallenge): Promise<ChallengeIssued | { status: 'cooldown' | 'locked' } | NetworkError>
}

const demoScenarios = ['default', 'expired', 'login-error', 'verify-error', 'resend-error'] as const
export type AuthDemo = typeof demoScenarios[number]

export function readAuthDemo(value: string | null): AuthDemo {
  return demoScenarios.find((scenario) => scenario === value) ?? 'default'
}

export function validateLogin({ email, password }: LoginInput) {
  const errors: LoginErrors = {}
  if (!email.trim()) errors.email = 'Enter your email address.'
  else if (email.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.email = 'Enter a valid email address.'
  }
  if (!password) errors.password = 'Enter a demo password.'
  return errors
}

export function isOtpCode(value: string) {
  return /^[0-9]{6}$/.test(value)
}

export function challengeStatus(challenge: AuthChallenge, now: number) {
  if (challenge.attemptsRemaining <= 0) return 'locked'
  if (challenge.expiresAt <= now) return 'expired'
  return 'pending'
}

export function authDemoSearch(scenario: AuthDemo) {
  return scenario === 'default' ? '' : '?' + new URLSearchParams({ demo: scenario })
}
