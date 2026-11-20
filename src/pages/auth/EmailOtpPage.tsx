import { useEffect, useRef, useState, type ClipboardEvent, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { challengeStatus, isOtpCode, type AuthAdapter, type AuthChallenge } from '../../features/auth/authModel'
import { useAuthRequest } from '../../features/auth/useAuthRequest'
import { Button, TextInput } from '../../shared/ui/controls'

type Props = {
  adapter: AuthAdapter
  challenge: AuthChallenge
  loginPath: string
  onChallenge: (challenge: AuthChallenge) => void
  onVerified: () => void
  onAbandon: () => void
}

function timeRemaining(deadline: number, now: number) {
  const seconds = Math.max(0, Math.ceil((deadline - now) / 1000))
  return Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0')
}

export function EmailOtpPage({ adapter, challenge, loginPath, onChallenge, onVerified, onAbandon }: Props) {
  const [code, setCode] = useState('')
  const [now, setNow] = useState(Date.now)
  const [codeError, setCodeError] = useState('')
  const [requestError, setRequestError] = useState('')
  const [notice, setNotice] = useState('')
  const codeField = useRef<HTMLInputElement>(null)
  const { pending, run } = useAuthRequest<'verify' | 'resend'>()
  const status = challengeStatus(challenge, now)
  const canResend = status !== 'locked' && now >= challenge.resendAvailableAt
  const challengeError = status === 'locked' ? 'Too many attempts. Go back to login to start again.'
    : status === 'expired' ? 'This code has expired. Resend to generate a new demo code.' : ''

  useEffect(() => {
    codeField.current?.focus()
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  function changeCode(value: string) {
    setCode(value)
    setCodeError('')
    setRequestError('')
    setNotice('')
  }

  function paste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault()
    if (pending || status !== 'pending') return
    const value = event.clipboardData.getData('text').trim()
    if (isOtpCode(value)) changeCode(value)
    else setCodeError('Paste exactly six digits.')
  }

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending || status !== 'pending') return
    setRequestError('')
    setNotice('')
    if (!isOtpCode(code)) {
      setCodeError('Enter exactly six digits.')
      codeField.current?.focus()
      return
    }
    const result = await run('verify', () => adapter.verifyOtp(challenge, code))
    if (!result) return
    setNow(Date.now())
    if (result.status === 'network-error') {
      setRequestError('Simulated network error. Try verifying again.')
    } else if (result.status === 'verified') {
      onVerified()
    } else {
      onChallenge(result.challenge)
      if (result.status === 'invalid') {
        setCodeError('Incorrect code. Attempts remaining: ' + result.challenge.attemptsRemaining + '.')
      }
    }
  }

  async function resend() {
    if (pending || !canResend) return
    setRequestError('')
    setNotice('')
    const result = await run('resend', () => adapter.resendOtp(challenge))
    if (!result) return
    setNow(Date.now())
    if (result.status === 'network-error') {
      setRequestError('Simulated network error. Try resending again.')
    } else if (result.status === 'challenge') {
      onChallenge(result.challenge)
      changeCode('')
      setNotice('New demo code generated.')
      codeField.current?.focus()
    }
  }

  return (
    <>
      <div className="auth-heading">
        <h1 className="page-title">Verify your email</h1>
        <p>Enter the demo code for <strong>{challenge.maskedEmail}</strong>.</p>
      </div>
      <form className="auth-form" noValidate aria-busy={Boolean(pending)} onSubmit={verify}>
        <div>
          <TextInput label="Verification code" id="demo-otp" name="otp" ref={codeField} type="text" inputMode="numeric"
            autoComplete="one-time-code" spellCheck={false} required maxLength={6} pattern="[0-9]{6}"
            className="auth-code" placeholder="000000" readOnly={Boolean(pending) || status !== 'pending'}
            aria-invalid={Boolean(codeError)} aria-describedby={codeError ? 'demo-otp-help demo-otp-error' : 'demo-otp-help'}
            value={code} onChange={(event) => {
              if (/^[0-9]{0,6}$/.test(event.currentTarget.value)) changeCode(event.currentTarget.value)
              else setCodeError('Enter digits only.')
            }} onPaste={paste} />
          <p id="demo-otp-help" className="auth-help">Type or paste all 6 digits.</p>
          {codeError && <p id="demo-otp-error" className="auth-error" role="alert">{codeError}</p>}
        </div>
        {challengeError && <p className="auth-error" role="alert">{challengeError}</p>}
        {requestError && <p className="auth-error" role="alert">{requestError}</p>}
        {notice && <p className="auth-notice" role="status">{notice}</p>}
        {status === 'pending' && <div className="auth-timing">
          <span>Expires in {timeRemaining(challenge.expiresAt, now)}</span>
          <span>{challenge.attemptsRemaining} {challenge.attemptsRemaining === 1 ? 'attempt' : 'attempts'} left</span>
        </div>}
        <Button className="auth-primary" type="submit" variant="primary" disabled={Boolean(pending) || status !== 'pending'}>
          {pending === 'verify' ? 'Verifying…' : 'Verify'}
        </Button>
        <div className="auth-actions">
          <Link className="text-link" to={loginPath} onClick={onAbandon}>Back to login</Link>
          <Button data-auth-resend disabled={Boolean(pending) || !canResend} onClick={resend}>
            {pending === 'resend' ? 'Resending…' : status !== 'locked' && !canResend
              ? 'Resend (' + timeRemaining(challenge.resendAvailableAt, now) + ')' : 'Resend'}
          </Button>
        </div>
      </form>
      <aside className="auth-demo">
        <strong>Development demo</strong>
        <p>{status === 'pending'
          ? <>Use <code data-demo-code>{challenge.developmentCode}</code> for this local challenge.</>
          : 'Generate a new local challenge to continue.'}</p>
      </aside>
    </>
  )
}
