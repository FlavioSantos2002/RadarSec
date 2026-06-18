import { useState, useEffect, useCallback } from 'react';

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

  const score = Math.round(baseScore * 10) / 10;
  const vector = `CVSS:3.1/AV:${metrics.attackVector}/AC:${metrics.attackComplexity}/PR:${metrics.privilegesRequired}/UI:${metrics.userInteraction}/S:${metrics.scope}/C:${metrics.confidentiality}/I:${metrics.integrity}/A:${metrics.availability}`;

  return { score, vector };
}

interface CvssCalculatorProps {
  onScoreChange: (score: number, vector: string) => void;
}

const DEFAULT_METRICS: CvssMetrics = {
  attackVector: 'N',
  attackComplexity: 'L',
  privilegesRequired: 'N',
  userInteraction: 'N',
  scope: 'U',
  confidentiality: 'H',
  integrity: 'H',
  availability: 'H',
};

function MetricSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <label className="block text-xs text-muted mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full text-sm bg-[#070d1a] border border-cyan-500/20 rounded-lg p-2 text-white"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

export default function CvssCalculator({ onScoreChange }: CvssCalculatorProps) {
  const [metrics, setMetrics] = useState<CvssMetrics>(DEFAULT_METRICS);
  
  // Desestruturação correta para acessar score e vector
  const { score, vector } = calculateCvss31(metrics);

  useEffect(() => {
    onScoreChange(score, vector);
  }, [score, vector, onScoreChange]);

  const update = (partial: Partial<CvssMetrics>) => {
    setMetrics((prev) => ({ ...prev, ...partial }));
  };

  return (
    <div className="border border-cyan-500/10 rounded-lg p-4 space-y-4 bg-[#0b1628]">
      <div className="flex items-center justify-between">
        <h4 className="font-black text-xs uppercase tracking-widest text-slate-400">Calculadora CVSS v3.1</h4>
        <span className="text-2xl font-black text-cyan-400">{score.toFixed(1)}</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricSelect
          label="Vetor de ataque"
          value={metrics.attackVector}
          options={[
            { value: 'N', label: 'Rede (N)' },
            { value: 'A', label: 'Adjacente (A)' },
            { value: 'L', label: 'Local (L)' },
            { value: 'P', label: 'Físico (P)' },
          ]}
          onChange={(v) => update({ attackVector: v })}
        />
        <MetricSelect
          label="Complexidade"
          value={metrics.attackComplexity}
          options={[
            { value: 'L', label: 'Baixa (L)' },
            { value: 'H', label: 'Alta (H)' },
          ]}
          onChange={(v) => update({ attackComplexity: v })}
        />
        <MetricSelect
          label="Privilégios"
          value={metrics.privilegesRequired}
          options={[
            { value: 'N', label: 'Nenhum (N)' },
            { value: 'L', label: 'Baixo (L)' },
            { value: 'H', label: 'Alto (H)' },
          ]}
          onChange={(v) => update({ privilegesRequired: v })}
        />
        <MetricSelect
          label="Interação"
          value={metrics.userInteraction}
          options={[
            { value: 'N', label: 'Nenhuma (N)' },
            { value: 'R', label: 'Necessária (R)' },
          ]}
          onChange={(v) => update({ userInteraction: v })}
        />
        <MetricSelect
          label="Escopo"
          value={metrics.scope}
          options={[
            { value: 'U', label: 'Inalterado (U)' },
            { value: 'C', label: 'Alterado (C)' },
          ]}
          onChange={(v) => update({ scope: v })}
        />
        <MetricSelect
          label="Confidencialidade"
          value={metrics.confidentiality}
          options={[
            { value: 'N', label: 'Nenhuma (N)' },
            { value: 'L', label: 'Baixa (L)' },
            { value: 'H', label: 'Alta (H)' },
          ]}
          onChange={(v) => update({ confidentiality: v })}
        />
        <MetricSelect
          label="Integridade"
          value={metrics.integrity}
          options={[
            { value: 'N', label: 'Nenhuma (N)' },
            { value: 'L', label: 'Baixa (L)' },
            { value: 'H', label: 'Alta (H)' },
          ]}
          onChange={(v) => update({ integrity: v })}
        />
        <MetricSelect
          label="Disponibilidade"
          value={metrics.availability}
          options={[
            { value: 'N', label: 'Nenhuma (N)' },
            { value: 'L', label: 'Baixa (L)' },
            { value: 'H', label: 'Alta (H)' },
          ]}
          onChange={(v) => update({ availability: v })}
        />
      </div>
    </div>
  );
}