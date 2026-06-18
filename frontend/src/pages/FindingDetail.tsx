import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import TopBar from '../components/layout/TopBar';
import StatusBadge from '../components/findings/StatusBadge';
import SeverityBadge from '../components/findings/SeverityBadge';
import CollaborationTimeline from '../components/timeline/CollaborationTimeline';
import AuditLogPanel from '../components/shared/AuditLog';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import {
  Finding, FindingStatus, Priority, PeerReview,
  STATUS_LABELS, PRIORITY_LABELS,
} from '../types';

export default function FindingDetail() {
  const { projectId, id } = useParams<{ projectId: string; id: string }>();
  const { user, isGestor } = useAuth();
  const [finding, setFinding] = useState<Finding | null>(null);
  const [reviews, setReviews] = useState<PeerReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    vector: true, payload: false, poc: false, evidences: false, attachments: true,
  });
  const [reviewComment, setReviewComment] = useState('');
  const [reviewApproved, setReviewApproved] = useState(true);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [statusError, setStatusError] = useState('');
  const [showPriority, setShowPriority] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState<Priority>('MEDIA');
  const [showAssign, setShowAssign] = useState(false);
  const [assignUserId, setAssignUserId] = useState('');
  const [members, setMembers] = useState<Array<{ id: string; name: string; role: string }>>([]);

  const fetchFinding = useCallback(async () => {
    if (!projectId || !id) return;
    const { data } = await api.get<{ finding: Finding }>(`/projects/${projectId}/findings/${id}`);
    setFinding(data.finding);
  }, [projectId, id]);

  const fetchReviews = useCallback(async () => {
    if (!id) return;
    const { data } = await api.get<{ reviews: PeerReview[] }>(`/findings/${id}/reviews`);
    setReviews(data.reviews);
  }, [id]);

  useEffect(() => {
    Promise.all([fetchFinding(), fetchReviews()]).finally(() => setLoading(false));
  }, [fetchFinding, fetchReviews]);

  useEffect(() => {
    if (projectId && isGestor) {
      api.get<{ project: { members: Array<{ user: { id: string; name: string; role: string } }> } }>(`/projects/${projectId}`)
        .then(({ data }) => setMembers(data.project.members?.map((m) => m.user) ?? []));
    }
  }, [projectId, isGestor]);

  const handleStatusChange = async (status: FindingStatus) => {
    if (!projectId || !id) return;
    setStatusError('');
    try {
      const { data } = await api.patch<{ finding: Finding }>(`/projects/${projectId}/findings/${id}/status`, { status });
      setFinding(data.finding);
    } catch (err: unknown) {
      setStatusError('Erro ao alterar status.');
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSubmittingReview(true);
    try {
      await api.post(`/findings/${id}/reviews`, { approved: reviewApproved, comment: reviewComment || undefined });
      setReviewComment('');
      await fetchReviews();
      await fetchFinding();
    } finally { setSubmittingReview(false); }
  };

  const handleSetPriority = async () => {
    if (!projectId || !id) return;
    const { data } = await api.patch<{ finding: Finding }>(`/projects/${projectId}/findings/${id}/priority`, { priority: selectedPriority });
    setFinding(data.finding);
    setShowPriority(false);
  };

  const handleAssign = async () => {
    if (!projectId || !id || !assignUserId) return;
    const { data } = await api.patch<{ finding: Finding }>(`/projects/${projectId}/findings/${id}/assign`, { assignedToId: assignUserId });
    setFinding(data.finding);
    setShowAssign(false);
  };

  const toggle = (section: string) => setExpanded((prev) => ({ ...prev, [section]: !prev[section] }));

  const handleDownloadAttachment = async (attachmentId: string, filename: string) => {
    if (!projectId || !id) return;
    const response = await api.get(`/projects/${projectId}/findings/${id}/attachments/${attachmentId}`, { responseType: 'blob' });
    const blob = new Blob([response.data]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
  };

  if (loading || !finding) return <div className="min-h-screen bg-[#070d1a] flex items-center justify-center text-white">Carregando...</div>;

  const canReview = user && finding && user.id !== finding.authorId;

  return (
    <div className="flex min-h-screen bg-[#070d1a]">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopBar title="Detalhe do Achado" />
        <main className="p-8">
          <Link to={`/projects/${projectId}`} className="text-cyan-400 text-xs font-black uppercase tracking-widest hover:underline mb-6 inline-block">
            ← Voltar ao projeto
          </Link>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Header do Achado */}
              <div className="bg-[#0b1628] border border-cyan-500/10 rounded-2xl p-6">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <SeverityBadge severity={finding.severity} />
                  <StatusBadge status={finding.status} />
                  {finding.cvssScore != null && <span className="bg-[#070d1a] border border-cyan-500/20 text-cyan-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">CVSS {finding.cvssScore.toFixed(1)}</span>}
                </div>
                <h1 className="text-2xl font-black text-white">{finding.title}</h1>
                <p className="text-slate-500 text-xs mt-2 uppercase tracking-wide">Por {finding.author.name} · {new Date(finding.createdAt).toLocaleString('pt-BR')}</p>
                <p className="text-slate-300 text-sm mt-6 leading-relaxed">{finding.description}</p>
              </div>

              {/* Seções Técnicas (Vetor, Payload, POC) */}
              {[
                { key: 'vector', label: 'Vetor de Ataque', content: finding.attackVector },
                { key: 'payload', label: 'Carga maliciosa', content: finding.payload },
                { key: 'poc', label: 'Prova de conceito', content: finding.poc }
              ].map(({ key, label, content }) => content && (
                <div key={key} className="bg-[#0b1628] border border-cyan-500/10 rounded-2xl overflow-hidden">
                  <button onClick={() => toggle(key)} className="w-full flex justify-between items-center p-4 text-xs font-black text-slate-400 uppercase tracking-widest hover:bg-[#0f1e38] transition-colors">
                    {label} <span>{expanded[key] ? '▾' : '▸'}</span>
                  </button>
                  {expanded[key] && <div className="p-4 border-t border-cyan-500/10 text-slate-300 text-sm font-mono bg-[#070d1a]">{content}</div>}
                </div>
              ))}

              {/* Revisão entre Pares */}
              <div className="bg-[#0b1628] border border-cyan-500/10 rounded-2xl p-6">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Revisão entre pares</h3>
                {reviews.map((r) => (
                  <div key={r.id} className="bg-[#070d1a] border border-cyan-500/5 rounded-xl p-4 mb-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-cyan-400 text-sm">{r.reviewer.name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${r.approved ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                        {r.approved ? '✓ Aprovado' : '✗ Reprovado'}
                      </span>
                    </div>
                    {r.comment && <p className="text-slate-500 text-xs">{r.comment}</p>}
                  </div>
                ))}
                {canReview && (
                  <form onSubmit={handleSubmitReview} className="space-y-3 border-t border-cyan-500/10 pt-4 mt-2">
                    <div className="flex gap-4">
                      <label className="text-slate-300 text-xs flex items-center gap-2"><input type="radio" checked={reviewApproved} onChange={() => setReviewApproved(true)} /> Aprovar</label>
                      <label className="text-slate-300 text-xs flex items-center gap-2"><input type="radio" checked={!reviewApproved} onChange={() => setReviewApproved(false)} /> Reprovar</label>
                    </div>
                    <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder="Comentário (opcional)" className="w-full bg-[#070d1a] border border-cyan-500/20 rounded-lg p-3 text-sm text-white" rows={2} />
                    <button type="submit" className="bg-cyan-500 text-[#070d1a] font-black text-xs px-4 py-2 rounded-lg uppercase tracking-widest hover:bg-cyan-400">Enviar revisão</button>
                  </form>
                )}
              </div>

              {/* Timeline */}
              <div className="bg-[#0b1628] border border-cyan-500/10 rounded-2xl p-6">
                <CollaborationTimeline findingId={id!} />
              </div>
            </div>

            {/* Painel Lateral */}
            <div className="space-y-6">
              <div className="bg-[#0b1628] border border-cyan-500/10 rounded-2xl p-6">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Status</h3>
                {(Object.keys(STATUS_LABELS) as FindingStatus[]).map((s) => (
                  <button key={s} onClick={() => handleStatusChange(s)} className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-widest mb-1 transition-all ${finding.status === s ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-500 hover:bg-[#0f1e38]'}`}>
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
              <div className="bg-[#0b1628] border border-cyan-500/10 rounded-2xl p-6">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Auditoria</h3>
                <div className="text-slate-500 text-xs"><AuditLogPanel logs={finding.auditLogs ?? []} /></div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}