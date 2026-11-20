import { useEffect, useRef, useState } from 'react'

export function useAuthRequest<Action extends string>() {
  const request = useRef<AbortController | null>(null)
  const [pending, setPending] = useState<Action | null>(null)

  useEffect(() => () => request.current?.abort(), [])

  async function run<Result>(action: Action, work: () => Promise<Result>): Promise<Result | undefined> {
    if (request.current) return
    const controller = new AbortController()
    request.current = controller
    setPending(action)

    try {
      const result = await work()
      return controller.signal.aborted ? undefined : result
    } finally {
      request.current = null
      if (!controller.signal.aborted) setPending(null)
    }
  }

  return { pending, run }
}
