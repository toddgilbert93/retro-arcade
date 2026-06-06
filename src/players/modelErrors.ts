import type { MoveErrorKind } from '../engine/types'

export class ModelMoveError extends Error {
  constructor(
    message: string,
    readonly kind: MoveErrorKind,
    readonly raw?: string,
    readonly uci?: string,
  ) {
    super(message)
    this.name = 'ModelMoveError'
  }
}

/** Truncate raw model output for logs and retry context. */
export function truncateRaw(raw: string | undefined, max = 200): string | undefined {
  if (!raw) return undefined
  const t = raw.replace(/\s+/g, ' ').trim()
  return t.length <= max ? t : t.slice(0, max) + '…'
}
