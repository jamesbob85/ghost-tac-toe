import { TournamentResult } from './runners/tournament';
import {
  VariantMetrics,
  buildWinMatrix,
  tallyPairing,
  avgTurns,
} from './analysis/metrics';

export interface ReportInput {
  startedAt: Date;
  totalDurationMs: number;
  results: TournamentResult[];
  metrics: VariantMetrics[];
}

const FUN_THRESHOLD = 0.5;

export function renderReport(input: ReportInput): string {
  const lines: string[] = [];

  lines.push(`# Simulation Report — ${input.startedAt.toISOString()}`);
  lines.push('');
  lines.push(summary(input));
  lines.push('');

  for (let i = 0; i < input.results.length; i++) {
    lines.push(variantSection(input.results[i], input.metrics[i]));
    lines.push('');
  }

  return lines.join('\n');
}

function summary(input: ReportInput): string {
  const lines: string[] = [];
  lines.push('## Summary');
  lines.push('');
  const totalMatches = input.metrics.reduce((s, m) => s + m.matches, 0);
  lines.push(`- ${input.metrics.length} variants tested · ${totalMatches.toLocaleString()} total matches`);
  lines.push(`- Wall time: ${Math.round(input.totalDurationMs / 1000)}s`);
  lines.push('');
  lines.push('| Variant | Solvedness | Gradient | Imbalance | Avg turns | Fun |');
  lines.push('|---|---:|---:|---:|---:|---:|');
  for (const m of input.metrics) {
    const fun = m.funScore.toFixed(2);
    const verdict = m.funScore >= FUN_THRESHOLD ? '✓' : '✗';
    lines.push(
      `| ${m.variantName} | ${fmt(m.solvedness)} | ${fmt(m.skillGradient)} | ${fmt(m.firstMoverImbalance)} | ${m.avgGameLength.toFixed(1)} | ${fun} ${verdict} |`,
    );
  }
  return lines.join('\n');
}

function variantSection(t: TournamentResult, m: VariantMetrics): string {
  const lines: string[] = [];
  lines.push(`## ${t.variant.name} — \`${t.variant.id}\``);
  lines.push('');
  lines.push(`> ${t.variant.description}`);
  lines.push('');
  lines.push('| Metric | Value |');
  lines.push('|---|---:|');
  lines.push(`| Matches | ${m.matches.toLocaleString()} |`);
  lines.push(`| Wall time | ${(m.durationMs / 1000).toFixed(1)}s |`);
  lines.push(`| Solvedness (lower = more variable) | ${fmt(m.solvedness)} |`);
  lines.push(`| Skill gradient (Pearson, higher = cleaner ladder) | ${fmt(m.skillGradient)} |`);
  lines.push(`| First-mover imbalance (lower = more balanced) | ${fmt(m.firstMoverImbalance)} |`);
  lines.push(`| Avg game length (turns) | ${m.avgGameLength.toFixed(1)} |`);
  lines.push(`| **Fun score** | **${m.funScore.toFixed(2)}** |`);
  lines.push('');
  lines.push('### Win-rate matrix (row beats column, %)');
  lines.push(winMatrixTable(t));
  lines.push('');
  lines.push('### Self-play outcomes');
  lines.push(selfPlayTable(t));
  lines.push('');
  return lines.join('\n');
}

function winMatrixTable(t: TournamentResult): string {
  const matrix = buildWinMatrix(t);
  const header = ['', ...t.strategies.map((s) => s.name)];
  const sep = header.map(() => '---');
  const lines: string[] = [];
  lines.push('| ' + header.join(' | ') + ' |');
  lines.push('|' + sep.join('|') + '|');
  for (let i = 0; i < t.strategies.length; i++) {
    const row = [t.strategies[i].name];
    for (let j = 0; j < t.strategies.length; j++) {
      const cell = matrix[i][j];
      const win = (cell.aWinPct * 100).toFixed(0);
      const draw = (cell.drawPct * 100).toFixed(0);
      row.push(i === j ? `_${win}/${draw}/${(cell.bWinPct * 100).toFixed(0)}_` : `${win}%`);
    }
    lines.push('| ' + row.join(' | ') + ' |');
  }
  lines.push('');
  lines.push('Self-play cells (italicised) show A-wins / draws / B-wins percentages.');
  return lines.join('\n');
}

function selfPlayTable(t: TournamentResult): string {
  const lines: string[] = [];
  lines.push('| Strategy | A wins | B wins | Draws | Avg turns |');
  lines.push('|---|---:|---:|---:|---:|');
  for (const s of t.strategies) {
    const sp = t.pairings.find((p) => p.aId === s.id && p.bId === s.id);
    if (!sp) continue;
    const o = tallyPairing(sp);
    lines.push(
      `| ${s.name} | ${pct(o.aWins, o.total)} | ${pct(o.bWins, o.total)} | ${pct(o.draws, o.total)} | ${avgTurns(sp.matches).toFixed(1)} |`,
    );
  }
  return lines.join('\n');
}

function pct(n: number, d: number): string {
  if (d === 0) return '0%';
  return `${((n / d) * 100).toFixed(0)}%`;
}

function fmt(n: number): string {
  if (Number.isNaN(n)) return 'n/a';
  return n.toFixed(3);
}
