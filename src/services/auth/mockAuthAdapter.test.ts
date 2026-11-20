import { describe, expect, it } from 'vitest'
import { createMockAuthAdapter } from './mockAuthAdapter'

const input = { email: 'analyst@example.test', password: 'demo-password' }

function setup(scenario: Parameters<typeof createMockAuthAdapter>[0] = 'default') {
  let time = 0
  const adapter = createMockAuthAdapter(scenario, { now: () => time, wait: async () => {} })
  async function start() {
    const result = await adapter.login(input)
    if (result.status !== 'challenge') throw new Error('Expected a demo challenge')
    return result.challenge
  }
  return { adapter, start, advance: (ms: number) => { time += ms } }
}

describe('local email verification adapter', () => {
  it('issues a timed challenge with masked email and verifies six digits', async () => {
    const { adapter, start } = setup()
    const challenge = await start()
    expect(challenge.maskedEmail).toBe('a••••@example.test')
    expect(challenge).not.toHaveProperty('password')
    expect(challenge).not.toHaveProperty('email')
    expect(challenge.expiresAt).toBe(300_000)
    expect(challenge.resendAvailableAt).toBe(30_000)
    expect(await adapter.verifyOtp(challenge, '123456x')).toMatchObject({ status: 'invalid' })
    expect(await adapter.verifyOtp(challenge, challenge.developmentCode)).toEqual({ status: 'verified' })
  })

  it('locks after three wrong attempts and rejects a resend on a locked challenge', async () => {
    const { adapter, start, advance } = setup()
    const challenge = await start()
    const first = await adapter.verifyOtp(challenge, '000000')
    if (first.status !== 'invalid') throw new Error('Expected an invalid code')
    const second = await adapter.verifyOtp(first.challenge, '000000')
    if (second.status !== 'invalid') throw new Error('Expected an invalid code')
    const third = await adapter.verifyOtp(second.challenge, '000000')
    expect(third).toMatchObject({ status: 'locked', challenge: { attemptsRemaining: 0 } })
    if (third.status !== 'locked') throw new Error('Expected a locked challenge')
    advance(31_000)
    expect(await adapter.verifyOtp(third.challenge, challenge.developmentCode)).toMatchObject({ status: 'locked' })
    expect(await adapter.resendOtp(third.challenge)).toMatchObject({ status: 'locked' })
  })

  it('blocks early resend, expires on time and rejects the old code after a resend', async () => {
    const { adapter, start, advance } = setup()
    const challenge = await start()
    expect(await adapter.resendOtp(challenge)).toEqual({ status: 'cooldown' })
    advance(300_000)
    expect(await adapter.verifyOtp(challenge, challenge.developmentCode)).toMatchObject({ status: 'expired' })
    const renewed = await adapter.resendOtp(challenge)
    if (renewed.status !== 'challenge') throw new Error('Expected a replacement challenge')
    expect(renewed.challenge.developmentCode).not.toBe(challenge.developmentCode)
    expect(renewed.challenge.attemptsRemaining).toBe(3)
    expect(await adapter.verifyOtp(renewed.challenge, challenge.developmentCode)).toMatchObject({ status: 'invalid' })
    expect(await adapter.verifyOtp(renewed.challenge, renewed.challenge.developmentCode)).toEqual({ status: 'verified' })
  })

  it('simulates a retryable failure at all three stages', async () => {
    const login = setup('login-error')
    expect(await login.adapter.login(input)).toEqual({ status: 'network-error' })
    await login.start()

    const verify = setup('verify-error')
    const challenge = await verify.start()
    expect(await verify.adapter.verifyOtp(challenge, challenge.developmentCode)).toEqual({ status: 'network-error' })
    expect(await verify.adapter.verifyOtp(challenge, challenge.developmentCode)).toEqual({ status: 'verified' })

    const resend = setup('resend-error')
    const pending = await resend.start()
    expect(await resend.adapter.resendOtp(pending)).toEqual({ status: 'network-error' })
    expect(await resend.adapter.resendOtp(pending)).toMatchObject({ status: 'challenge' })
  })
})
