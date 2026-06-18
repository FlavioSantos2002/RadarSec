export function validateCvssScore(score: number | null | undefined): boolean {
  if (score === null || score === undefined) return true;
  return score >= 0.0 && score <= 10.0;
}

export function roundCvssScore(score: number): number {
  return Math.round(score * 10) / 10;
}

export interface CvssMetrics {
  attackVector: 'N' | 'A' | 'L' | 'P';
  attackComplexity: 'L' | 'H';
  privilegesRequired: 'N' | 'L' | 'H';
  userInteraction: 'N' | 'R';
  scope: 'U' | 'C';
  confidentiality: 'N' | 'L' | 'H';
  integrity: 'N' | 'L' | 'H';
  availability: 'N' | 'L' | 'H';
}

const AV_MAP: Record<string, number> = { N: 0.85, A: 0.62, L: 0.55, P: 0.2 };
const AC_MAP: Record<string, number> = { L: 0.77, H: 0.44 };
const PR_MAP_U: Record<string, number> = { N: 0.85, L: 0.62, H: 0.27 };
const PR_MAP_C: Record<string, number> = { N: 0.85, L: 0.68, H: 0.5 };
const UI_MAP: Record<string, number> = { N: 0.85, R: 0.62 };
const IMPACT_MAP: Record<string, number> = { N: 0, L: 0.22, H: 0.56 };

export function calculateCvss31(metrics: CvssMetrics): { score: number; vector: string } {
  const av = AV_MAP[metrics.attackVector] ?? 0.85;
  const ac = AC_MAP[metrics.attackComplexity] ?? 0.77;
  const prMap = metrics.scope === 'C' ? PR_MAP_C : PR_MAP_U;
  const pr = prMap[metrics.privilegesRequired] ?? 0.85;
  const ui = UI_MAP[metrics.userInteraction] ?? 0.85;

  const c = IMPACT_MAP[metrics.confidentiality] ?? 0;
  const i = IMPACT_MAP[metrics.integrity] ?? 0;
  const a = IMPACT_MAP[metrics.availability] ?? 0;

  const iscBase = 1 - (1 - c) * (1 - i) * (1 - a);

  let impact: number;
  if (metrics.scope === 'U') {
    impact = 6.42 * iscBase;
  } else {
    impact = 7.52 * (iscBase - 0.029) - 3.25 * Math.pow(iscBase - 0.02, 15);
  }

  const exploitability = 8.22 * av * ac * pr * ui;

  let baseScore: number;
  if (impact <= 0) {
    baseScore = 0;
  } else if (metrics.scope === 'U') {
    baseScore = Math.min(impact + exploitability, 10);
  } else {
    baseScore = Math.min(1.08 * (impact + exploitability), 10);
  }

  const score = roundCvssScore(baseScore);
  const vector = `CVSS:3.1/AV:${metrics.attackVector}/AC:${metrics.attackComplexity}/PR:${metrics.privilegesRequired}/UI:${metrics.userInteraction}/S:${metrics.scope}/C:${metrics.confidentiality}/I:${metrics.integrity}/A:${metrics.availability}`;

  return { score, vector };
}
