import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Radar } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import TopBar from '../components/layout/TopBar';
import FindingCard from '../components/findings/FindingCard';
import FindingForm, { FindingFormData } from '../components/findings/FindingForm';
import ConfirmModal from '../components/shared/ConfirmModal';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import { Project, FindingSummary, ProjectReport, STATUS_LABELS, SEVERITY_LABELS, ROLE_LABELS } from '../types';

type Tab = 'findings' | 'members' | 'report';
const CHART_COLORS = ['#06b6d4', '#22c55e', '#eab308', '#ef4444', '#7c3aed'];

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { isGestor, isHunter } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [findings, setFindings] = useState<FindingSummary[]>([]);
  const [report, setReport] = useState<ProjectReport | null>(null);
  const [tab, setTab] = useState<Tab>('findings');
  const [loading, setLoading] = useState(true);
  
  // Estados para Ações
  const [showNewFinding, setShowNewFinding] = useState(false);
  const [editingFinding, setEditingFinding] = useState<FindingSummary | null>(null);
  const [deletingFinding, setDeletingFinding] = useState<FindingSummary | null>(null);
  
  const [memberUserId, setMemberUserId] = useState('');
  const [allUsers, setAllUsers] = useState<Array<{ id: string; name: string; email: string }>>([]);

  const fetchProject = useCallback(async () => {
    if (!id) return;
    const { data } = await api.get<{ project: Project }>(`/projects/${id}`);
    setProject(data.project);
  }, [id]);

  const fetchFindings = useCallback(async () => {
    if (!id) return;
    const { data } = await api.get<{ findings: FindingSummary[] }>(`/projects/${id}/findings`);
    setFindings(data.findings);
  }, [id]);

  useEffect(() => {
    Promise.all([fetchProject(), fetchFindings(), api.get(`/projects/${id}/reports`).then(r => setReport(r.data.report))])
      .finally(() => setLoading(false));
  }, [id, fetchProject, fetchFindings]);

  useEffect(() => {
    if (isGestor) api.get<{ users: Array<{ id: string; name: string; email: string }> }>('/auth/users').then(({ data }) => setAllUsers(data.users));
  }, [isGestor]);

  const handleDelete = async () => {
    console.log("DEBUG: Tentando deletar achado:", deletingFinding?.id);
    if (!deletingFinding) return;
    try {
      await api.delete(`/projects/${id}/findings/${deletingFinding.id}`);
      console.log("DEBUG: Deleção realizada com sucesso.");
      setDeletingFinding(null);
      await fetchFindings();
    } catch (err) {
      console.error("DEBUG: Erro ao deletar:", err);
      alert("Erro ao excluir. Verifique o console.");
    }
  };

  const handleAddMember = async () => {
    if (!id || !memberUserId) return;
    await api.post(`/projects/${id}/members`, { userId: memberUserId });
    setMemberUserId(''); // Limpa o select
    await fetchProject(); // Atualiza a lista de membros vinda do servidor
  };

  const handleRemoveMember = async (userId: string) => {
    if (!id) return;
    await api.delete(`/projects/${id}/members/${userId}`);
    await fetchProject(); // Atualiza a lista de membros vinda do servidor
  };

  if (loading || !project) return <div className="min-h-screen bg-[#070d1a] flex items-center justify-center text-white">Carregando...</div>;

  return (
    <div className="flex min-h-screen bg-[#070d1a]">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopBar title={project.name} />
        <main className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter">{project.name}</h1>
            <p className="text-slate-500 text-sm mt-2">{project.description}</p>
          </div>

          <div className="flex gap-6 mb-8 border-b border-cyan-500/10">
            {(['findings', 'members', 'report'] as Tab[]).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`pb-4 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${tab === t ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-600 hover:text-slate-400'}`}>
                {t}
              </button>
            ))}
          </div>

          {tab === 'findings' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-white font-black uppercase tracking-widest text-sm">Achados</h2>
                {isHunter && <button onClick={() => setShowNewFinding(true)} className="bg-cyan-500 text-[#070d1a] font-black text-xs px-5 py-2 rounded-lg uppercase tracking-widest hover:bg-cyan-400">+ Novo Achado</button>}
              </div>
              <div className="grid gap-3">
                {findings.map((f) => (
                  <FindingCard 
                    key={f.id} 
                    finding={f} 
                    projectId={id!} 
                    onEdit={() => setEditingFinding(f)}
                    onDelete={() => setDeletingFinding(f)}
                  />
                ))}
              </div>
            </div>
          )}

          {tab === 'members' && (
            <div className="space-y-6">
              {isGestor && (
                <div className="bg-[#0b1628] border border-cyan-500/10 rounded-2xl p-6 flex gap-4">
                  <select value={memberUserId} onChange={(e) => setMemberUserId(e.target.value)} className="flex-1 bg-[#070d1a] border border-cyan-500/20 rounded-xl p-3 text-white text-sm">
                    <option value="">Selecione um usuário...</option>
                    {allUsers.filter((u) => !project.members?.some((m) => m.userId === u.id)).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                  <button onClick={handleAddMember} className="bg-cyan-500 text-[#070d1a] font-black text-xs px-6 py-3 rounded-xl hover:bg-cyan-400">ADICIONAR</button>
                </div>
              )}
              <div className="grid gap-3">
                {project.members?.map((m) => (
                  <div key={m.id} className="bg-[#0b1628] border border-cyan-500/10 rounded-2xl p-4 flex items-center justify-between">
                    <div><p className="font-bold text-white text-sm">{m.user.name}</p><p className="text-[10px] text-slate-500">{m.user.email}</p></div>
                    <div className="flex items-center gap-4"><span className="bg-[#070d1a] border border-cyan-500/20 text-cyan-400 px-3 py-1 rounded-full text-[10px] font-black uppercase">{ROLE_LABELS[m.user.role]}</span>
                    {isGestor && <button onClick={() => handleRemoveMember(m.userId)} className="text-red-400 text-[10px] font-bold uppercase hover:underline">Remover</button>}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'report' && report && (
            <div className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="bg-[#0b1628] border border-cyan-500/10 rounded-2xl p-6">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Status</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart><Pie data={report.byStatus.map(s => ({name: STATUS_LABELS[s.status], quantidade: s.count}))} dataKey="quantidade" outerRadius={80} innerRadius={60} paddingAngle={5}>
                      {report.byStatus.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie><Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #06b6d4' }} /></PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-[#0b1628] border border-cyan-500/10 rounded-2xl p-6">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Severidade</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={report.bySeverity.map(s => ({name: SEVERITY_LABELS[s.severity], quantidade: s.count}))}>
                      <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 10 }} />
                      <Bar dataKey="quantidade" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                      <Tooltip contentStyle={{ backgroundColor: '#070d1a', border: '1px solid #06b6d4' }} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modais de Controle */}
      {showNewFinding && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b1628] border border-cyan-500/20 rounded-2xl p-8 max-w-2xl w-full">
             <FindingForm onSubmit={async (data) => { await api.post(`/projects/${id}/findings`, data); setShowNewFinding(false); await fetchFindings(); }} />
          </div>
        </div>
      )}

      {editingFinding && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b1628] border border-cyan-500/20 rounded-2xl p-8 max-w-2xl w-full">
            <h2 className="text-white font-black uppercase tracking-widest text-sm mb-6">Editar Achado</h2>
            <FindingForm 
              initial={editingFinding} 
              submitLabel="Atualizar Achado"
              onSubmit={async (data) => {
                await api.patch(`/projects/${id}/findings/${editingFinding.id}`, data);
                setEditingFinding(null);
                await fetchFindings();
              }} 
            />
          </div>
        </div>
      )}

      {deletingFinding && (
        <ConfirmModal
          open={true} 
          title="Excluir Achado"
          message={`Tem certeza que deseja excluir "${deletingFinding.title}"? Esta ação não pode ser desfeita.`}
          onConfirm={handleDelete}
          onCancel={() => setDeletingFinding(null)}
          danger={true} 
        />
      )}
    </div>
  );
}