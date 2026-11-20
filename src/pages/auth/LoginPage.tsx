import { useState, type FormEvent } from 'react'
import { validateLogin, type AuthAdapter, type AuthChallenge, type LoginErrors } from '../../features/auth/authModel'
import { useAuthRequest } from '../../features/auth/useAuthRequest'
import { Button, TextInput } from '../../shared/ui/controls'

export function LoginPage({ adapter, onChallenge }: { adapter: AuthAdapter; onChallenge: (challenge: AuthChallenge) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isVisible, setIsVisible] = useState(false)
  const [errors, setErrors] = useState<LoginErrors>({})
  const [requestError, setRequestError] = useState('')
  const { pending, run } = useAuthRequest<'login'>()

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    setRequestError('')
    const input = { email, password }
    const validation = validateLogin(input)
    setErrors(validation)
    const first = validation.email ? 'email' : validation.password ? 'password' : null
    if (first) {
      const target = event.currentTarget.elements.namedItem(first)
      if (target instanceof HTMLElement) target.focus()
      return
    }
    const result = await run('login', () => adapter.login(input))
    if (result?.status === 'network-error') {
      setRequestError('Simulated network error. Try signing in again.')
    } else if (result?.status === 'invalid') {
      setErrors(result.errors)
    } else if (result?.status === 'challenge') {
      setPassword('')
      onChallenge(result.challenge)
    }
  }

  return (
    <>
      <div className="auth-heading">
        <h1 className="page-title">Sign in</h1>
        <p>Use a sample email and password to start demo verification.</p>
      </div>
      <form className="auth-form" noValidate autoComplete="off" onSubmit={submit} aria-busy={Boolean(pending)}>
        <div>
          <TextInput name="email" label="Email" type="email" placeholder="analyst@example.test" required disabled={Boolean(pending)}
            value={email} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'demo-email-error' : undefined}
            onChange={(event) => {
              setEmail(event.currentTarget.value)
              setErrors({ ...errors, email: undefined })
              setRequestError('')
            }} />
          {errors.email && <p id="demo-email-error" className="auth-error" role="alert">{errors.email}</p>}
        </div>
        <div>
          <div className="auth-password">
            <TextInput id="demo-password" name="password" label="Password" type={isVisible ? 'text' : 'password'} required
              disabled={Boolean(pending)} value={password} aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? 'demo-password-error' : undefined}
              onChange={(event) => {
                setPassword(event.currentTarget.value)
                setErrors({ ...errors, password: undefined })
                setRequestError('')
              }} />
            <Button className="auth-password__toggle" aria-controls="demo-password" aria-pressed={isVisible}
              aria-label={isVisible ? 'Hide password' : 'Show password'} disabled={Boolean(pending)}
              onClick={() => setIsVisible(!isVisible)}>{isVisible ? 'Hide' : 'Show'}</Button>
          </div>
          {errors.password && <p id="demo-password-error" className="auth-error" role="alert">{errors.password}</p>}
        </div>
        {requestError && <p className="auth-error" role="alert">{requestError}</p>}
        <Button className="auth-primary" type="submit" variant="primary" disabled={Boolean(pending)}>
          {pending ? 'Starting verification…' : 'Sign in'}
        </Button>
      </form>
      <aside className="auth-demo">
        <strong>Development demo</strong>
        <p>Verification uses a local challenge. The code appears in the next step.</p>
      </aside>
    </>
  )
}
