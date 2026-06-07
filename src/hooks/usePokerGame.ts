import { useCallback, useEffect, useRef, useState } from 'react'
import { PokerRunner } from '@/poker/pokerRunner'
import type { PokerRunnerState } from '@/poker/types'

const initialState: PokerRunnerState = {
  phase: 'idle',
  snapshot: null,
  log: [],
  thinking: null,
  commentary: null,
  winnerLabel: null,
  error: null,
  autoplay: false,
  pausePending: false,
}

export function usePokerGame() {
  const runnerRef = useRef<PokerRunner | null>(null)
  if (runnerRef.current === null) runnerRef.current = new PokerRunner()
  const runner = runnerRef.current

  const [state, setState] = useState<PokerRunnerState>(initialState)

  useEffect(() => runner.subscribe(setState), [runner])

  const start = useCallback((seed?: number) => void runner.run(undefined, seed), [runner])
  const pause = useCallback(() => runner.pause(), [runner])
  const resume = useCallback(() => runner.resume(), [runner])
  const reset = useCallback(() => runner.reset(), [runner])

  return { ...state, start, pause, resume, reset }
}
