import type { Seat } from './types'
import { DEFAULT_POKER_PLAYER_MODEL_IDS } from './pokerRunner'
import openAiLogo from '@/assets/logos/openAI.png'
import googleLogo from '@/assets/logos/google.png'
import xaiLogo from '@/assets/logos/xai.png'
import antLogo from '@/assets/logos/ant.png'

const MODEL_LOGO_BY_ID: Record<string, string> = {
  'm:openai/gpt-5.4-mini': openAiLogo,
  'm:google/gemini-3.1-flash-lite': googleLogo,
  'm:x-ai/grok-4.3': xaiLogo,
  'm:anthropic/claude-sonnet-4.6': antLogo,
}

/** Dark monochrome logos — lightened for the navy leaderboard rows. */
const LIGHT_LOGO_MODEL_IDS = new Set([
  'm:openai/gpt-5.4-mini',
  'm:x-ai/grok-4.3',
  'm:anthropic/claude-sonnet-4.6',
])

export function modelLogoForId(id: string): string | undefined {
  return MODEL_LOGO_BY_ID[id]
}

export function modelLogoIconClass(id: string): string | undefined {
  return LIGHT_LOGO_MODEL_IDS.has(id) ? 'leaderboard-avatar-light' : undefined
}

export function modelLogoForSeat(seat: Seat): string {
  const id = DEFAULT_POKER_PLAYER_MODEL_IDS[seat]
  return MODEL_LOGO_BY_ID[id] ?? openAiLogo
}
