import { useState, useCallback } from 'react';
import { Severity } from '../../types';
import CvssCalculator from './CvssCalculator';

export interface FindingFormData {
  title: string;
  description: string;
  attackVector: string;
  payload: string;
  poc: string;
  severity: Severity;
  cvssScore: number | null;
  cvssVector: string | null;
  evidences: string;
}

interface FindingFormProps {
  initial?: Partial<FindingFormData>;
  onSubmit: (data: FindingFormData, attachments: File[]) => Promise<void>;
  submitLabel?: string;
}

const EMPTY: FindingFormData = {
  title: '',
  description: '',
  attackVector: '',
  payload: '',
  poc: '',
  severity: 'MEDIA',
  cvssScore: null,
  cvssVector: null,
  evidences: '',
};

export default function FindingForm({
  initial,
  onSubmit,
  submitLabel = 'Criar Achado',
}: FindingFormProps) {
  const [form, setForm] = useState<FindingFormData>({ ...EMPTY, ...initial });
  const [attachments, setAttachments] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = 'Título é obrigatório.';
    if (!form.description.trim()) e.description = 'Descrição é obrigatória.';
    if (!form.attackVector.trim()) e.attackVector = 'Vetor de ataque é obrigatório.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // Callback estável para o CvssCalculator
  const handleCvssChange = useCallback((score: number, vector: string) => {
    setForm((prev) => {
      if (prev.cvssScore === score && prev.cvssVector === vector) return prev;
      return { ...prev, cvssScore: score, cvssVector: vector };
    });
  }, []);

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    
    setLoading(true);
    try {
      // Limpeza do payload: garante apenas os campos esperados pelo backend
      const cleanData: FindingFormData = {
        title: form.title,
        description: form.description ?? '',
        attackVector: form.attackVector ?? '',
        payload: form.payload ?? '',
        poc: form.poc ?? '',
        severity: form.severity ? form.severity : undefined,
        cvssScore: form.cvssScore !== null ? Number(form.cvssScore) : null,
        cvssVector: form.cvssVector,
        evidences: form.evidences ?? '',
      };
      
      await onSubmit(cleanData, attachments);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(ev.target.files ?? []);
    setAttachments(files);
  };

  const update = (field: keyof FindingFormData, value: string | Severity | number | null) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const inputClass = "w-full bg-[#070d1a] border border-cyan-500/20 rounded-xl p-3 text-white text-sm focus:border-cyan-400 focus:outline-none transition-all";
  const labelClass = "block text-xs font-black text-slate-400 uppercase tracking-widest mb-2";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className={labelClass}>Título *</label>
          <input type="text" value={form.title ?? ''} onChange={(e) => update('title', e.target.value)} className={inputClass} />
          {errors.title && <p className="text-red-400 text-[10px] mt-1">{errors.title}</p>}
        </div>

        <div className="md:col-span-2">
          <label className={labelClass}>Descrição *</label>
          <textarea value={form.description ?? ''} onChange={(e) => update('description', e.target.value)} rows={3} className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Vetor de Ataque *</label>
          <input type="text" value={form.attackVector ?? ''} onChange={(e) => update('attackVector', e.target.value)} placeholder="Ex: Rede — POST /api/login" className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Severidade *</label>
          <select value={form.severity} onChange={(e) => update('severity', e.target.value as Severity)} className={inputClass}>
            <option value="CRITICA">Crítica</option>
            <option value="ALTA">Alta</option>
            <option value="MEDIA">Média</option>
            <option value="BAIXA">Baixa</option>
            <option value="INFORMATIVA">Informativa</option>
          </select>
        </div>
      </div>

      <div className="space-y-6">
        <label className={labelClass}>Payload & PoC</label>
        <textarea value={form.payload ?? ''} onChange={(e) => update('payload', e.target.value)} rows={2} className={`${inputClass} font-mono`} placeholder="Carga maliciosa..." />
        <textarea value={form.poc ?? ''} onChange={(e) => update('poc', e.target.value)} rows={2} className={`${inputClass} font-mono`} placeholder="Prova de conceito..." />
      </div>

      <div className="border border-cyan-500/10 rounded-2xl p-4 bg-[#070d1a]">
        <CvssCalculator onScoreChange={handleCvssChange} />
      </div>

      <div>
        <label className={labelClass}>Anexos (Máx 5 arquivos/10MB)</label>
        <input type="file" multiple onChange={handleFileChange} className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-cyan-500/10 file:text-cyan-400 hover:file:bg-cyan-500/20" />
      </div>

      <button type="submit" disabled={loading} 
        className="w-full bg-cyan-500 text-[#070d1a] font-black text-sm px-8 py-4 rounded-xl uppercase tracking-widest hover:bg-cyan-400 transition-all shadow-lg shadow-cyan-500/20">
        {loading ? 'Salvando...' : submitLabel}
      </button>
    </form>
  );
}