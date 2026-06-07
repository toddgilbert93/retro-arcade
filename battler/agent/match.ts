import { runBattle, aiChooser, aiReplacer } from '../engine/driver.ts';
import type { SideId } from '../engine/battle.ts';
import { buildPlayerSide } from '../factory.ts';
import type { RentalPokemon } from '../data/types.ts';
import type { ArenaModel } from './models.ts';
import { hasApiKey, callModel } from './llm.ts';
import { draftTeams } from './draft.ts';
import { randomDraftPool } from '../data/draftPool.ts';
import { RNG } from '../engine/rng.ts';
import {
  makeLLMChooser,
  makeLLMReplacer,
  makeLLMDrafter,
  heuristicDrafter,
  type Logger,
  type ModelCaller,
} from './llmChooser.ts';

export interface MatchOptions {
  modelA: ArenaModel;
  modelB: ArenaModel;
  /** Battle RNG seed (draft/play model calls remain non-deterministic). */
  seed?: number;
  /** Receives every draft + battle line as it happens. */
  log?: Logger;
  /** Force LLM play on/off. Defaults to whether an API key is available. */
  useLLM?: boolean;
  /** Override the OpenRouter caller for side A (defaults to {@link callModel}). */
  callerA?: ModelCaller;
  /** Override the OpenRouter caller for side B (defaults to {@link callModel}). */
  callerB?: ModelCaller;
}

export interface MatchResult {
  winner: SideId;
  winnerModel: ArenaModel;
  turns: number;
  transcript: string[];
  teamA: RentalPokemon[];
  teamB: RentalPokemon[];
  picks: { side: SideId; species: string }[];
}

/**
 * Draft two teams then run one battle between them. Side A = modelA (player),
 * Side B = modelB (enemy). With no API key (or useLLM:false) both sides use the
 * engine's heuristic AI, so a match always completes.
 */
export async function runMatch(opts: MatchOptions): Promise<MatchResult> {
  const { modelA, modelB } = opts;
  const transcript: string[] = [];
  const log: Logger = (line) => {
    transcript.push(line);
    opts.log?.(line);
  };
  const useLLM = opts.useLLM ?? hasApiKey();
  const callerA = opts.callerA ?? callModel;
  const callerB = opts.callerB ?? callModel;

  const drafterA = useLLM ? makeLLMDrafter(modelA.model, callerA, log) : heuristicDrafter;
  const drafterB = useLLM ? makeLLMDrafter(modelB.model, callerB, log) : heuristicDrafter;

  log(`=== DRAFT: ${modelA.label} (A) vs ${modelB.label} (B)${useLLM ? '' : ' [heuristic]'} ===`);
  const draftRng = new RNG(opts.seed);
  const pool = randomDraftPool(draftRng);
  const { teamA, teamB, picks } = await draftTeams(drafterA, drafterB, { log, pool });

  const sideA = buildPlayerSide(modelA.label, teamA);
  const sideB = buildPlayerSide(modelB.label, teamB);

  log('=== BATTLE ===');
  const result = await runBattle(sideA, sideB, {
    seed: opts.seed,
    onLog: log,
    playerChooser: useLLM ? makeLLMChooser(modelA.model, callerA, log) : aiChooser,
    enemyChooser: useLLM ? makeLLMChooser(modelB.model, callerB, log) : aiChooser,
    playerReplacer: useLLM ? makeLLMReplacer(modelA.model, callerA, log) : aiReplacer,
    enemyReplacer: useLLM ? makeLLMReplacer(modelB.model, callerB, log) : aiReplacer,
  });

  const winnerModel = result.winner === 0 ? modelA : modelB;
  log(
    `=== RESULT: ${winnerModel.label} (${result.winner === 0 ? 'A' : 'B'}) wins in ${result.turns} turns ===`,
  );

  return {
    winner: result.winner,
    winnerModel,
    turns: result.turns,
    transcript,
    teamA,
    teamB,
    picks,
  };
}
