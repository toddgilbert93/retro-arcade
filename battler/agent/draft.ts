import type { RentalPokemon } from '../data/types.ts';
import { randomDraftPool } from '../data/draftPool.ts';
import { POKEMON_BY_ID } from '../data/pokemon.ts';
import type { Drafter, Logger } from './llmChooser.ts';

export const TEAM_SIZE = 4;

/** Snake pick order for two 4-mon teams: A,B,B,A,A,B,B,A. */
export const SNAKE_ORDER: SideId[] = [0, 1, 1, 0, 0, 1, 1, 0];
type SideId = 0 | 1;

export interface DraftResult {
  teamA: RentalPokemon[];
  teamB: RentalPokemon[];
  /** Pick-by-pick log for display. */
  picks: { side: SideId; species: string }[];
}

/**
 * Run a snake draft from a shared pool. Each side picks 4; a mon taken by either
 * side is removed from the shared pool (no duplicates). Each pick calls the
 * side's drafter with the current draft state and is validated against the
 * remaining pool before being committed.
 */
export async function draftTeams(
  drafterA: Drafter,
  drafterB: Drafter,
  opts: { pool?: RentalPokemon[]; log?: Logger } = {},
): Promise<DraftResult> {
  const remaining = [...(opts.pool ?? randomDraftPool())];
  const teamA: RentalPokemon[] = [];
  const teamB: RentalPokemon[] = [];
  const picks: { side: SideId; species: string }[] = [];

  let pickNumber = 0;
  for (const side of SNAKE_ORDER) {
    const drafter = side === 0 ? drafterA : drafterB;
    const myTeam = side === 0 ? teamA : teamB;
    const oppTeam = side === 0 ? teamB : teamA;

    let idx = await drafter(remaining, myTeam, oppTeam, pickNumber);
    // Guard against an out-of-range index from a misbehaving drafter.
    if (!Number.isInteger(idx) || idx < 0 || idx >= remaining.length) idx = 0;

    const [picked] = remaining.splice(idx, 1);
    myTeam.push(picked!);
    const name = POKEMON_BY_ID[picked!.species]!.name;
    picks.push({ side, species: name });
    opts.log?.(`Pick ${pickNumber + 1}: ${side === 0 ? 'A' : 'B'} drafts ${name}`);
    pickNumber++;
  }

  return { teamA, teamB, picks };
}
