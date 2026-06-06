import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { GameController } from '../engine/gameController'
import { GameRecorder } from '../engine/gameRecorder'
import type { GameRecord } from '../engine/recordingTypes'
import type { GameSnapshot, Side } from '../engine/types'
import {
  DEFAULT_BLACK_MODEL_ID,
  DEFAULT_WHITE_MODEL_ID,
  makePlayer,
  playerMeta,
} from '../players/playerFactory'

// Player options live in playerFactory (shared with the headless batch runner);
// re-exported here so existing UI imports keep working.
export { PLAYER_OPTIONS } from '../players/playerFactory'
export type { PlayerOption } from '../players/playerFactory'

export function useChessGame() {
  const controllerRef = useRef<GameController | null>(null)
  if (controllerRef.current === null) {
    controllerRef.current = new GameController(
      makePlayer(DEFAULT_WHITE_MODEL_ID, 'w'),
      makePlayer(DEFAULT_BLACK_MODEL_ID, 'b'),
    )
  }
  const controller = controllerRef.current

  const recorderRef = useRef<GameRecorder | null>(null)
  if (recorderRef.current === null) {
    recorderRef.current = new GameRecorder(
      controller,
      playerMeta(DEFAULT_WHITE_MODEL_ID, 'w'),
      playerMeta(DEFAULT_BLACK_MODEL_ID, 'b'),
    )
  }
  const recorder = recorderRef.current

  const [snapshot, setSnapshot] = useState<GameSnapshot | null>(null)
  const [gameRecord, setGameRecord] = useState<GameRecord | null>(null)
  const [whiteId, setWhiteId] = useState<string>(DEFAULT_WHITE_MODEL_ID)
  const [blackId, setBlackId] = useState<string>(DEFAULT_BLACK_MODEL_ID)

  useEffect(() => controller.subscribe(setSnapshot), [controller])

  useEffect(() => {
    recorder.attach()
    return () => recorder.detach()
  }, [recorder])

  useEffect(() => {
    recorder.updatePlayers(playerMeta(whiteId, 'w'), playerMeta(blackId, 'b'))
  }, [recorder, whiteId, blackId])

  const syncRecord = useCallback(() => {
    setGameRecord(recorder.getRecord())
  }, [recorder])

  useEffect(() => {
    if (!snapshot) return
    syncRecord()
  }, [snapshot, syncRecord])

  const setPlayerType = useCallback(
    (side: Side, id: string) => {
      controller.setPlayer(side, makePlayer(id, side))
      if (side === 'w') setWhiteId(id)
      else setBlackId(id)
    },
    [controller],
  )

  const actions = useMemo(
    () => ({
      start: () => controller.start(),
      pause: () => controller.pause(),
      step: () => controller.step(),
      reset: () => {
        controller.reset()
        recorder.reset(playerMeta(whiteId, 'w'), playerMeta(blackId, 'b'))
        setGameRecord(recorder.getRecord())
      },
      setPlayerType,
      downloadGame: (format: 'json' | 'ndjson' = 'json') => recorder.download(format),
      exportGameJson: (pretty = true) => recorder.toJSON(pretty),
      exportGameNdjson: () => recorder.toNdjson(),
    }),
    [controller, recorder, setPlayerType, whiteId, blackId],
  )

  return { snapshot, gameRecord, whiteId, blackId, ...actions }
}
