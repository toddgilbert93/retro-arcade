// AI-vs-AI arena: two models draft 4-mon teams then battle.
// Run with: npm run arena -- <modelA> <modelB> [seed]
//   e.g. npm run arena -- m:anthropic/claude-sonnet-4.6 m:openai/gpt-5.4-mini
import { MODELS, modelListHelp, resolveModel } from './agent/models.ts';
import { hasApiKey } from './agent/llm.ts';
import { runMatch } from './agent/match.ts';

function fail(msg: string): never {
  console.error(msg);
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.length < 2) {
  fail(
    'Usage: npm run arena -- <modelA> <modelB> [seed]\n\n' +
      `Available models:\n${modelListHelp()}\n\n` +
      'You must select two models to start.',
  );
}

let modelA;
let modelB;
try {
  modelA = resolveModel(args[0]!);
  modelB = resolveModel(args[1]!);
} catch (e) {
  fail(e instanceof Error ? e.message : String(e));
}

const seed = args[2] ? Number(args[2]) : undefined;

if (!hasApiKey()) {
  console.warn(
    '⚠ OPENROUTER_API_KEY not set — running with the engine heuristic AI ' +
      '(no model calls). Set the key to have the models actually play.\n',
  );
}

console.log(`Arena: ${modelA.label} (A) vs ${modelB.label} (B)`);
if (seed !== undefined) console.log(`Battle seed: ${seed}`);
console.log(`Models available: ${MODELS.length}\n`);

const result = await runMatch({
  modelA,
  modelB,
  seed,
  log: (line) => console.log(line),
});

console.log('\n--- Teams ---');
console.log(`A (${modelA.label}): ${result.teamA.map((r) => r.species).join(', ')}`);
console.log(`B (${modelB.label}): ${result.teamB.map((r) => r.species).join(', ')}`);
console.log(`\nWinner: ${result.winnerModel.label} in ${result.turns} turns.`);
