#!/usr/bin/env tsx
/**
 * Simulation harness entry point.
 *
 * Usage:
 *   npx tsx simulation/run.ts                          # phase 0 default
 *   npx tsx simulation/run.ts --matches 50             # smaller run
 *   npx tsx simulation/run.ts --variants ghost_only    # subset
 *   npx tsx simulation/run.ts --no-report              # skip writing markdown
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { PHASE_0_STRATEGIES, RESOURCE_STRATEGIES } from './strategies';
import { Strategy } from './strategies/types';
import { PHASE_0_VARIANTS, VARIANTS, Variant } from './variants';
import { runTournament, TournamentResult } from './runners/tournament';
import { computeVariantMetrics, VariantMetrics } from './analysis/metrics';
import { renderReport } from './report';

interface CliArgs {
  matches: number;
  variants: Variant[];
  strategies: Strategy[];
  writeReport: boolean;
  seed: number;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    matches: 100,
    variants: PHASE_0_VARIANTS,
    strategies: PHASE_0_STRATEGIES,
    writeReport: true,
    seed: 0xc0ffee,
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--matches') args.matches = parseInt(argv[++i], 10);
    else if (a === '--seed') args.seed = parseInt(argv[++i], 10);
    else if (a === '--no-report') args.writeReport = false;
    else if (a === '--resource') args.strategies = RESOURCE_STRATEGIES;
    else if (a === '--variants') {
      const ids = argv[++i].split(',');
      const found = ids.map((id) => VARIANTS[id]).filter(Boolean);
      if (found.length === 0) {
        console.error(`Unknown variants: ${ids.join(',')}`);
        process.exit(1);
      }
      args.variants = found;
    } else if (a === '--help' || a === '-h') {
      console.log(`
Ghost Tac Toe simulation harness

Options:
  --matches N       Matches per pairing per side (default 100; total per pairing = 2N)
  --variants A,B    Comma-separated variant ids (default phase-0)
  --seed N          Master RNG seed (default 0xc0ffee)
  --no-report       Skip writing markdown report
  --help            This message

Available variants:
${Object.values(VARIANTS).map((v) => `  ${v.id.padEnd(20)} ${v.description}`).join('\n')}
`);
      process.exit(0);
    }
  }

  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  console.log('— Ghost Tac Toe Simulation —');
  console.log(`Strategies: ${args.strategies.map((s) => s.name).join(', ')}`);
  console.log(`Variants:   ${args.variants.map((v) => v.name).join(', ')}`);
  console.log(`Matches:    ${args.matches} per side per pairing (×${args.strategies.length ** 2} pairings × ${args.variants.length} variants)`);
  const totalMatches = args.matches * 2 * args.strategies.length ** 2 * args.variants.length;
  console.log(`Total:      ${totalMatches.toLocaleString()} matches`);
  console.log('');

  const startedAt = new Date();
  const t0 = Date.now();
  const results: TournamentResult[] = [];
  const metrics: VariantMetrics[] = [];

  for (const variant of args.variants) {
    console.log(`▸ ${variant.name} (${variant.id})`);
    let lastPct = -1;
    const result = runTournament(args.strategies, variant, {
      matchesPerPairing: args.matches,
      seed: args.seed,
      onProgress: (done, total) => {
        const pct = Math.floor((done / total) * 20) * 5;
        if (pct > lastPct) {
          lastPct = pct;
          process.stdout.write(`  ${pct}%\r`);
        }
      },
    });
    const m = computeVariantMetrics(result);
    results.push(result);
    metrics.push(m);
    console.log(`  ✓ ${(result.durationMs / 1000).toFixed(1)}s  ·  fun=${m.funScore.toFixed(2)}  solv=${m.solvedness.toFixed(2)}  grad=${m.skillGradient.toFixed(2)}`);
  }

  const totalDurationMs = Date.now() - t0;

  console.log('');
  console.log(`Done in ${(totalDurationMs / 1000).toFixed(1)}s.`);

  if (args.writeReport) {
    const report = renderReport({ startedAt, totalDurationMs, results, metrics });
    const fname = formatReportFilename(startedAt);
    const __filename = fileURLToPath(import.meta.url);
    const reportPath = resolve(dirname(__filename), 'reports', fname);
    mkdirSync(dirname(reportPath), { recursive: true });
    writeFileSync(reportPath, report);
    console.log(`Report: ${reportPath}`);
  }

  // Verdict
  console.log('');
  for (const m of metrics) {
    const v = m.funScore >= 0.5 ? '✓ ship' : '✗ needs work';
    console.log(`  ${m.variantName.padEnd(16)}  fun=${m.funScore.toFixed(2)}  ${v}`);
  }
}

function formatReportFilename(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}.md`;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
