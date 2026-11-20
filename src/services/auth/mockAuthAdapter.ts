import { challengeStatus, isOtpCode, validateLogin, type AuthAdapter, type AuthChallenge, type AuthDemo } from '../../features/auth/authModel'

const demoPolicy = { validityMs: 300_000, cooldownMs: 30_000, attempts: 3 }
const initialCode = '123456'
const replacementCode = '654321'

type MockTiming = { now: () => number; wait: () => Promise<void> }

const timing: MockTiming = {
  now: Date.now,
  wait: () => new Promise((resolve) => setTimeout(resolve, 220)),
}

function maskEmail(email: string) {
  const at = email.lastIndexOf('@')
  return email[0] + '••••' + email.slice(at)
}

export function createMockAuthAdapter(scenario: AuthDemo = 'default', { now, wait }: MockTiming = timing): AuthAdapter {
  let simulatedFailureUsed = false

  async function failed(action: 'login' | 'verify' | 'resend') {
    await wait()
    if (simulatedFailureUsed || scenario !== action + '-error') return false
    simulatedFailureUsed = true
    return true
  }

  function issue(maskedEmail: string, developmentCode: string, firstChallenge = false): AuthChallenge {
    const at = now()
    const expired = firstChallenge && scenario === 'expired'
    const canResend = expired || (firstChallenge && scenario === 'resend-error')
    return {
      maskedEmail,
      developmentCode,
      expiresAt: expired ? at : at + demoPolicy.validityMs,
      resendAvailableAt: canResend ? at : at + demoPolicy.cooldownMs,
      attemptsRemaining: demoPolicy.attempts,
    }
  }

  return {
    async login(input) {
      const errors = validateLogin(input)
      if (Object.keys(errors).length) return { status: 'invalid', errors }
      if (await failed('login')) return { status: 'network-error' }
      return { status: 'challenge', challenge: issue(maskEmail(input.email.trim()), initialCode, true) }
    },
    async verifyOtp(challenge, code) {
      if (await failed('verify')) return { status: 'network-error' }
      const status = challengeStatus(challenge, now())
      if (status !== 'pending') return { status, challenge }
      if (isOtpCode(code) && code === challenge.developmentCode) return { status: 'verified' }

      const attemptsRemaining = challenge.attemptsRemaining - 1
      return {
        status: attemptsRemaining === 0 ? 'locked' : 'invalid',
        challenge: { ...challenge, attemptsRemaining },
      }
    },
    async resendOtp(challenge) {
      if (challenge.attemptsRemaining <= 0) return { status: 'locked' }
      if (challenge.resendAvailableAt > now()) return { status: 'cooldown' }
      if (await failed('resend')) return { status: 'network-error' }

      const nextCode = challenge.developmentCode === initialCode ? replacementCode : initialCode
      return { status: 'challenge', challenge: issue(challenge.maskedEmail, nextCode) }
    },
  }
}
