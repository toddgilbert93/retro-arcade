import { useCallback, useEffect, useRef, useState } from 'react'
import { PokemonBattleRunner } from '@/pokemon/battleRunner'
import type { RunnerState } from '@/pokemon/types'
import type { ArenaModel } from '@battler/agent/models.ts'

const initialState: RunnerState = {
  phase: 'idle',
  snapshot: null,
  draftPicks: [],
  log: [],
  winnerLabel: null,
  thinking: null,
  error: null,
  autoplay: false,
  pausePending: false,
}

export function usePokemonBattle() {
  const runnerRef = useRef<PokemonBattleRunner | null>(null)
  if (runnerRef.current === null) runnerRef.current = new PokemonBattleRunner()
  const runner = runnerRef.current

  const [state, setState] = useState<RunnerState>(initialState)

  useEffect(() => runner.subscribe(setState), [runner])

  const start = useCallback(
    (a: ArenaModel, b: ArenaModel, seed?: number) => {
      void runner.run(a, b, seed)
    },
    [runner],
  )
  const pause = useCallback(() => runner.pause(), [runner])
  const resume = useCallback(() => runner.resume(), [runner])
  const reset = useCallback(() => runner.reset(), [runner])

  return { ...state, start, pause, resume, reset }
}
