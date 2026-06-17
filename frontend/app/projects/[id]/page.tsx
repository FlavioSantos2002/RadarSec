"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import {
  Radar, ArrowLeft, FolderOpen, ShieldAlert, Plus, X, Trash2, Clock,
  AlertTriangle, Search, ChevronDown, Paperclip, Upload, FileText,
  Image as ImageIcon, File, Download, Shield, Activity, CheckCircle2,
  LogOut, ExternalLink, User
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

// ── Types ─────────────────────────────────────────────────────────────────────

type TeamUser = { id: string; fullname: string; email: string };

type Evidence = {
  id: string;
  originalName: string;
  mimetype: string;
  size: number;
  uploadedBy: string;
  createdAt: string;
};

type Incident = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  status: string;
  userId: string;
  responsibleId: string | null;
  user: TeamUser;
  responsible: TeamUser | null;
  project: { id: string; name: string };
  _count: { evidences: number };
  createdAt: string;
  updatedAt: string;
};

type Project = {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  owner: TeamUser;
  _count: { incidents: number };
  createdAt: string;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const SEVERITIES = ["baixa", "media", "alta", "critica"] as const;
const STATUSES = ["aberto", "em_andamento", "fechado"] as const;
const CATEGORIES = [
  { value: "phishing", label: "Phishing" },
  { value: "malware", label: "Malware" },
  { value: "brute_force", label: "Brute Force" },
  { value: "ddos", label: "DDoS" },
  { value: "vazamento_de_dados", label: "Vazamento de Dados" },
  { value: "acesso_nao_autorizado", label: "Acesso Não Autorizado" },
  { value: "engenharia_social", label: "Engenharia Social" },
  { value: "outro", label: "Outro" },
] as const;

const SEVERITY_STYLE: Record<string, string> = {
  baixa: "bg-green-500/10 text-green-400 border-green-500/20",
  media: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  alta: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  critica: "bg-red-500/10 text-red-400 border-red-500/20",
};

const STATUS_STYLE: Record<string, string> = {
  aberto: "bg-red-500/10 text-red-400 border-red-500/20",
  em_andamento: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  fechado: "bg-green-500/10 text-green-400 border-green-500/20",
};

const CATEGORY_STYLE: Record<string, string> = {
  phishing: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  malware: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  brute_force: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  ddos: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  vazamento_de_dados: "bg-red-500/10 text-red-400 border-red-500/20",
  acesso_nao_autorizado: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  engenharia_social: "bg-teal-500/10 text-teal-400 border-teal-500/20",
  outro: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

const PIE_COLORS = ["#4ade80", "#fbbf24", "#f97316", "#f87171"];

// ── Main Component ─────────────────────────────────────────────────────────────

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [termoBusca, setTermoBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroSeveridade, setFiltroSeveridade] = useState("todas");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>("user");

  // Modals
  const [modalIncidente, setModalIncidente] = useState<Incident | null>(null);
  const [modalTab, setModalTab] = useState<"info" | "evidencias">("info");
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [loadingEvidences, setLoadingEvidences] = useState(false);

  // Create / edit incident form
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "outro",
    severity: "baixa",
    status: "aberto",
    responsibleId: "",
  });
  const [erroForm, setErroForm] = useState("");

  // Evidence upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  // ── Load data ────────────────────────────────────────────────────────────────

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setCurrentUserId(payload.userId);
      setCurrentUserRole(payload.role);
    } catch {}

    Promise.all([
      api.get<Project>(`/projects/${projectId}`),
      api.get<Incident[]>(`/incidents?projectId=${projectId}`),
      api.get<TeamUser[]>(`/auth/users`),
    ])
      .then(([pRes, iRes, uRes]) => {
        setProject(pRes.data);
        setIncidents(iRes.data);
        setUsers(uRes.data);
      })
      .catch(() => router.push("/projects"))
      .finally(() => setCarregando(false));
  }, [projectId]);

  // ── Derived data ─────────────────────────────────────────────────────────────

  const filteredIncidents = useMemo(() => {
    const term = termoBusca.toLowerCase();
    return incidents.filter((i) => {
      const matchText = i.title.toLowerCase().includes(term) || i.description.toLowerCase().includes(term);
      const matchStatus = filtroStatus === "todos" || i.status === filtroStatus;
      const matchSev = filtroSeveridade === "todas" || i.severity === filtroSeveridade;
      return matchText && matchStatus && matchSev;
    });
  }, [incidents, termoBusca, filtroStatus, filtroSeveridade]);

  const stats = useMemo(() => {
    const total = incidents.length;
    const abertos = incidents.filter(i => i.status === "aberto").length;
    const criticos = incidents.filter(i => i.severity === "critica").length;
    const fechados = incidents.filter(i => i.status === "fechado").length;
    const pieData = SEVERITIES.map(s => ({
      name: s, value: incidents.filter(i => i.severity === s).length,
    })).filter(d => d.value > 0);
    return { total, abertos, criticos, fechados, pieData };
  }, [incidents]);

  // ── Incident CRUD ────────────────────────────────────────────────────────────

  async function handleSalvarIncidente(e: React.FormEvent) {
    e.preventDefault();
    setErroForm("");
    try {
      if (editingId) {
        const { data } = await api.put<Incident>(`/incidents/${editingId}`, {
          title: form.title,
          description: form.description,
          category: form.category,
          severity: form.severity,
          status: form.status,
          responsibleId: form.responsibleId || null,
        });
        setIncidents(prev => prev.map(i => i.id === editingId ? data : i));
      } else {
        const { data } = await api.post<Incident>(`/incidents`, {
          projectId,
          title: form.title,
          description: form.description,
          category: form.category,
          severity: form.severity,
          status: form.status,
          responsibleId: form.responsibleId || null,
        });
        setIncidents(prev => [data, ...prev]);
      }
      resetForm();
    } catch {
      setErroForm("Erro ao salvar incidente.");
    }
  }

  async function handleDeleteIncidente(id: string) {
    if (!confirm("Excluir este incidente?")) return;
    try {
      await api.delete(`/incidents/${id}`);
      setIncidents(prev => prev.filter(i => i.id !== id));
      if (modalIncidente?.id === id) setModalIncidente(null);
    } catch {}
  }

  function prepararEdicao(inc: Incident) {
    setEditingId(inc.id);
    setForm({
      title: inc.title,
      description: inc.description,
      category: inc.category,
      severity: inc.severity,
      status: inc.status,
      responsibleId: inc.responsibleId || "",
    });
    setShowForm(true);
  }

  function resetForm() {
    setForm({ title: "", description: "", category: "outro", severity: "baixa", status: "aberto", responsibleId: "" });
    setEditingId(null);
    setShowForm(false);
    setErroForm("");
  }

  // ── Evidence ─────────────────────────────────────────────────────────────────

  async function openIncidentModal(inc: Incident) {
    setModalIncidente(inc);
    setModalTab("info");
  }

  async function loadEvidences(incidentId: string) {
    setLoadingEvidences(true);
    try {
      const { data } = await api.get<Evidence[]>(`/incidents/${incidentId}/evidence`);
      setEvidences(data);
    } catch {} finally {
      setLoadingEvidences(false);
    }
  }

  useEffect(() => {
    if (modalIncidente && modalTab === "evidencias") {
      loadEvidences(modalIncidente.id);
    }
  }, [modalTab, modalIncidente]);

  async function handleUploadEvidence(file: File) {
    if (!modalIncidente) return;
    setUploadingFile(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      await api.post(`/incidents/${modalIncidente.id}/evidence`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await loadEvidences(modalIncidente.id);
      // Update incident count
      setIncidents(prev => prev.map(i =>
        i.id === modalIncidente.id
          ? { ...i, _count: { evidences: i._count.evidences + 1 } }
          : i
      ));
    } catch { alert("Erro ao enviar arquivo."); }
    finally { setUploadingFile(false); }
  }

  async function handleDeleteEvidence(evidenceId: string) {
    if (!confirm("Remover esta evidência?")) return;
    try {
      await api.delete(`/evidence/${evidenceId}`);
      setEvidences(prev => prev.filter(e => e.id !== evidenceId));
      if (modalIncidente) {
        setIncidents(prev => prev.map(i =>
          i.id === modalIncidente.id
            ? { ...i, _count: { evidences: Math.max(0, i._count.evidences - 1) } }
            : i
        ));
      }
    } catch {}
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  function handleLogout() {
    api.post("/auth/logout").catch(() => {});
    localStorage.removeItem("token");
    router.push("/login");
  }

  function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function evidenceIcon(mimetype: string) {
    if (mimetype.startsWith("image/")) return <ImageIcon size={16} className="text-blue-400" />;
    if (mimetype === "application/pdf") return <FileText size={16} className="text-red-400" />;
    return <File size={16} className="text-slate-400" />;
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  if (carregando) return (
    <div className="min-h-screen bg-[#070d1a] flex items-center justify-center">
      <div className="flex items-center gap-3 text-cyan-400">
        <Radar size={20} className="animate-spin" />
        <span className="text-sm font-bold tracking-widest uppercase">Carregando...</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#070d1a] flex">
      {/* ── Sidebar ──────────────────────────────────────────────────────────── */}
      <aside className="w-64 bg-[#070d1a] border-r border-cyan-500/10 flex flex-col p-6 sticky top-0 h-screen scanlines">
        <div className="flex items-center gap-2 mb-10">
          <div className="bg-[#0d1e3a] border border-cyan-500/30 p-2 rounded-xl">
            <Radar size={22} className="text-cyan-400" />
          </div>
          <span className="text-lg font-black text-white tracking-tighter uppercase">
            Radar<span className="text-cyan-400">Sec</span>
          </span>
        </div>

        <nav className="flex-1 space-y-1">
          <Link href="/projects" className="flex items-center gap-3 text-slate-500 hover:text-cyan-400 px-4 py-3 rounded-xl text-sm transition-colors group">
            <ArrowLeft size={15} className="group-hover:-translate-x-1 transition-transform" />
            Projetos
          </Link>
          <div className="flex items-center gap-3 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 px-4 py-3 rounded-xl text-sm font-bold">
            <FolderOpen size={15} />
            <span className="truncate">{project?.name}</span>
          </div>
        </nav>

        {project && (
          <div className="bg-[#0d1829] border border-cyan-500/10 rounded-xl p-3 mb-4 text-xs space-y-1.5">
            <p className="text-slate-600 uppercase font-black tracking-widest text-[9px]">Responsável</p>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-cyan-500/20 rounded-full flex items-center justify-center">
                <User size={10} className="text-cyan-400" />
              </div>
              <span className="text-slate-300 truncate">{project.owner.fullname}</span>
            </div>
          </div>
        )}

        <button onClick={handleLogout}
          className="flex items-center gap-3 text-slate-600 hover:text-red-400 px-4 py-3 rounded-xl text-sm transition-colors w-full">
          <LogOut size={15} />
          Sair
        </button>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Header */}
        <header className="border-b border-cyan-500/10 px-8 py-5 flex items-center justify-between bg-[#070d1a] sticky top-0 z-10">
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">{project?.name}</h1>
            <p className="text-slate-600 text-xs mt-0.5 line-clamp-1">{project?.description}</p>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(s => !s); }}
            className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-[#070d1a] font-black text-xs px-4 py-2.5 rounded-xl uppercase tracking-widest transition-all shadow-lg shadow-cyan-500/20">
            <Plus size={14} />
            Novo Incidente
          </button>
        </header>

        <div className="p-8 space-y-6 flex-1">
          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MiniStat label="Total" value={stats.total} color="cyan" />
            <MiniStat label="Abertos" value={stats.abertos} color="red" />
            <MiniStat label="Críticos" value={stats.criticos} color="orange" pulse={stats.criticos > 0} />
            <MiniStat label="Fechados" value={stats.fechados} color="green" />
          </div>

          {/* Charts + create form */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Severity donut */}
            <div className="bg-[#0b1628] border border-cyan-500/10 rounded-2xl p-5">
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3">Severidade</p>
              {stats.pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={stats.pieData} innerRadius={45} outerRadius={65} paddingAngle={4} dataKey="value">
                      {stats.pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "#0b1628", border: "1px solid rgba(34,211,238,0.15)", borderRadius: 8 }}
                      labelStyle={{ color: "#94a3b8" }}
                      itemStyle={{ color: "#e2e8f0" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-40 flex items-center justify-center text-slate-700 text-xs">Sem incidentes</div>
              )}
            </div>

            {/* Create / edit form */}
            {showForm && (
              <div className="lg:col-span-2 bg-[#0b1628] border border-cyan-500/20 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-bold text-white text-sm uppercase tracking-widest">
                    {editingId ? "Editar Incidente" : "Novo Incidente"}
                  </h3>
                  <button onClick={resetForm} className="text-slate-600 hover:text-white"><X size={16} /></button>
                </div>

                {erroForm && (
                  <p className="mb-4 text-red-400 text-xs font-bold bg-red-900/20 py-2 px-3 rounded-lg border border-red-900/30">{erroForm}</p>
                )}

                <form onSubmit={handleSalvarIncidente} className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="label-xs">Título</label>
                    <input required value={form.title}
                      onChange={e => setForm({ ...form, title: e.target.value })}
                      className="input-dark w-full" placeholder="Descreva o incidente brevemente" />
                  </div>

                  <div>
                    <label className="label-xs">Categoria</label>
                    <select required value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                      className="input-dark w-full">
                      {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="label-xs">Severidade</label>
                    <select value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })}
                      className="input-dark w-full">
                      {SEVERITIES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="label-xs">Status</label>
                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                      className="input-dark w-full">
                      <option value="aberto">Aberto</option>
                      <option value="em_andamento">Em Andamento</option>
                      <option value="fechado">Fechado</option>
                    </select>
                  </div>

                  <div>
                    <label className="label-xs">Responsável por acompanhar</label>
                    <select value={form.responsibleId} onChange={e => setForm({ ...form, responsibleId: e.target.value })}
                      className="input-dark w-full">
                      <option value="">— Nenhum —</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.fullname} ({u.email})</option>)}
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="label-xs">Descrição</label>
                    <textarea required rows={3} value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                      className="input-dark w-full resize-none" placeholder="Detalhes técnicos do incidente..." />
                  </div>

                  <div className="col-span-2 flex justify-end gap-3">
                    <button type="button" onClick={resetForm}
                      className="px-4 py-2 rounded-xl border border-slate-700 text-slate-400 text-sm font-bold hover:border-slate-500 transition-colors">
                      Cancelar
                    </button>
                    <button type="submit"
                      className="px-6 py-2 bg-cyan-500 hover:bg-cyan-400 text-[#070d1a] rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-cyan-500/20">
                      {editingId ? "Salvar" : "Registrar"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {!showForm && (
              <div className="lg:col-span-2 bg-[#0b1628] border border-dashed border-cyan-500/10 rounded-2xl flex items-center justify-center text-slate-700 cursor-pointer hover:border-cyan-500/30 hover:text-slate-500 transition-all"
                onClick={() => setShowForm(true)}>
                <div className="text-center py-10">
                  <Plus size={24} className="mx-auto mb-2" />
                  <p className="text-xs font-bold uppercase tracking-widest">Registrar Incidente</p>
                </div>
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={15} />
              <input type="text" placeholder="Buscar incidentes..."
                value={termoBusca} onChange={e => setTermoBusca(e.target.value)}
                className="input-dark w-full pl-9 text-sm" />
            </div>
            <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}
              className="input-dark text-sm">
              <option value="todos">Todos os status</option>
              <option value="aberto">Aberto</option>
              <option value="em_andamento">Em Andamento</option>
              <option value="fechado">Fechado</option>
            </select>
            <select value={filtroSeveridade} onChange={e => setFiltroSeveridade(e.target.value)}
              className="input-dark text-sm">
              <option value="todas">Todas severidades</option>
              {SEVERITIES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>

          {/* Incidents table */}
          <div className="bg-[#0b1628] border border-cyan-500/10 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-cyan-500/10 flex justify-between items-center">
              <h3 className="font-bold text-slate-300 text-sm uppercase tracking-widest">Incidentes</h3>
              <span className="text-[10px] text-slate-600 font-black uppercase">{filteredIncidents.length} registro{filteredIncidents.length !== 1 ? "s" : ""}</span>
            </div>

            {filteredIncidents.length === 0 ? (
              <div className="py-16 text-center">
                <ShieldAlert size={32} className="mx-auto text-slate-700 mb-3" />
                <p className="text-slate-600 text-sm font-bold uppercase tracking-widest">Nenhum incidente encontrado</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-[10px] text-slate-600 uppercase font-black border-b border-cyan-500/10">
                      <th className="px-6 py-3 text-left">Incidente</th>
                      <th className="px-4 py-3 text-center">Categoria</th>
                      <th className="px-4 py-3 text-center">Severidade</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-center">Responsável</th>
                      <th className="px-4 py-3 text-center">Evidências</th>
                      <th className="px-4 py-3 text-center">Data</th>
                      <th className="px-4 py-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cyan-500/5">
                    {filteredIncidents.map((inc) => (
                      <tr key={inc.id}
                        className="hover:bg-cyan-500/5 transition-colors cursor-pointer group"
                        onClick={() => openIncidentModal(inc)}>
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-200 text-sm flex items-center gap-2">
                            {inc.title}
                            <ExternalLink size={11} className="opacity-0 group-hover:opacity-50 text-cyan-400" />
                          </div>
                          <div className="text-xs text-slate-600 truncate max-w-[220px] mt-0.5">{inc.description}</div>
                        </td>
                        <td className="px-4 py-4 text-center" onClick={e => e.stopPropagation()}>
                          <Badge cls={CATEGORY_STYLE[inc.category] || CATEGORY_STYLE["processando"]}>
                            {inc.category?.replace("_", " ") || "IA..."}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 text-center" onClick={e => e.stopPropagation()}>
                          <Badge cls={SEVERITY_STYLE[inc.severity] || SEVERITY_STYLE["baixa"]}>
                            {inc.severity}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 text-center" onClick={e => e.stopPropagation()}>
                          <Badge cls={STATUS_STYLE[inc.status] || STATUS_STYLE["aberto"]}>
                            {inc.status.replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 text-center text-xs text-slate-500" onClick={e => e.stopPropagation()}>
                          {inc.responsible?.fullname || <span className="text-slate-700">—</span>}
                        </td>
                        <td className="px-4 py-4 text-center" onClick={e => e.stopPropagation()}>
                          {inc._count.evidences > 0 ? (
                            <span className="flex items-center justify-center gap-1 text-cyan-400 text-xs font-bold">
                              <Paperclip size={11} />{inc._count.evidences}
                            </span>
                          ) : <span className="text-slate-700">—</span>}
                        </td>
                        <td className="px-4 py-4 text-center text-[10px] text-slate-600 font-bold uppercase" onClick={e => e.stopPropagation()}>
                          {new Date(inc.createdAt).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="px-4 py-4 text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => prepararEdicao(inc)}
                              className="p-1.5 text-slate-600 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors">
                              <Plus size={14} className="rotate-45" />
                            </button>
                            {(currentUserId === inc.userId || currentUserRole === "admin") && (
                              <button onClick={() => handleDeleteIncidente(inc.id)}
                                className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── Incident Detail Modal ─────────────────────────────────────────────── */}
      {modalIncidente && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b1628] border border-cyan-500/15 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/10">
              <div className="flex items-center gap-3">
                <ShieldAlert size={18} className="text-cyan-400" />
                <h2 className="font-bold text-white text-sm uppercase tracking-widest">Incidente</h2>
              </div>
              <button onClick={() => setModalIncidente(null)} className="text-slate-600 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-cyan-500/10 px-6">
              {(["info", "evidencias"] as const).map(tab => (
                <button key={tab} onClick={() => setModalTab(tab)}
                  className={`px-4 py-3 text-xs font-black uppercase tracking-widest border-b-2 transition-colors ${
                    modalTab === tab
                      ? "border-cyan-400 text-cyan-400"
                      : "border-transparent text-slate-600 hover:text-slate-400"
                  }`}>
                  {tab === "info" ? "Informações" : `Evidências (${modalIncidente._count.evidences})`}
                </button>
              ))}
            </div>

            {/* Modal body */}
            <div className="overflow-y-auto flex-1 p-6">
              {modalTab === "info" && (
                <div className="space-y-5">
                  <div>
                    <p className="label-xs mb-1">Título</p>
                    <p className="text-white font-bold text-lg">{modalIncidente.title}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="label-xs mb-1">Categoria</p>
                      <Badge cls={CATEGORY_STYLE[modalIncidente.category] || CATEGORY_STYLE["processando"]}>
                        {modalIncidente.category?.replace("_", " ") || "IA..."}
                      </Badge>
                    </div>
                    <div>
                      <p className="label-xs mb-1">Severidade</p>
                      <Badge cls={SEVERITY_STYLE[modalIncidente.severity]}>{modalIncidente.severity}</Badge>
                    </div>
                    <div>
                      <p className="label-xs mb-1">Status</p>
                      <Badge cls={STATUS_STYLE[modalIncidente.status]}>{modalIncidente.status.replace("_", " ")}</Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="label-xs mb-1">Criado por</p>
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <div className="w-6 h-6 bg-cyan-500/10 border border-cyan-500/20 rounded-full flex items-center justify-center">
                          <User size={10} className="text-cyan-400" />
                        </div>
                        {modalIncidente.user.fullname}
                      </div>
                    </div>
                    <div>
                      <p className="label-xs mb-1">Responsável</p>
                      {modalIncidente.responsible ? (
                        <div className="flex items-center gap-2 text-sm text-slate-300">
                          <div className="w-6 h-6 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center">
                            <Shield size={10} className="text-green-400" />
                          </div>
                          {modalIncidente.responsible.fullname}
                        </div>
                      ) : (
                        <span className="text-slate-600 text-sm">Não atribuído</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="label-xs mb-1">Descrição</p>
                    <p className="text-slate-400 text-sm leading-relaxed bg-[#070d1a] border border-cyan-500/10 p-4 rounded-xl whitespace-pre-wrap">
                      {modalIncidente.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-slate-600 text-xs pt-2 border-t border-cyan-500/10">
                    <Clock size={12} />
                    Registrado em {new Date(modalIncidente.createdAt).toLocaleString("pt-BR")}
                  </div>
                </div>
              )}

              {modalTab === "evidencias" && (
                <div className="space-y-4">
                  {/* Upload area */}
                  <div
                    className="border border-dashed border-cyan-500/20 rounded-xl p-6 text-center hover:border-cyan-500/40 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); }}
                    onDrop={e => {
                      e.preventDefault();
                      const f = e.dataTransfer.files[0];
                      if (f) handleUploadEvidence(f);
                    }}>
                    {uploadingFile ? (
                      <div className="flex items-center justify-center gap-2 text-cyan-400">
                        <Upload size={18} className="animate-bounce" />
                        <span className="text-sm font-bold">Enviando...</span>
                      </div>
                    ) : (
                      <>
                        <Upload size={24} className="mx-auto text-slate-600 mb-2" />
                        <p className="text-sm font-bold text-slate-500">Arraste ou clique para enviar</p>
                        <p className="text-[10px] text-slate-700 mt-1 uppercase tracking-widest">
                          Imagens • PDF • TXT — máx 10 MB
                        </p>
                      </>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" className="hidden"
                    accept="image/*,.pdf,.txt"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadEvidence(f); e.target.value = ""; }}
                  />

                  {/* Evidence list */}
                  {loadingEvidences ? (
                    <div className="text-center py-8 text-slate-600 text-sm">Carregando evidências...</div>
                  ) : evidences.length === 0 ? (
                    <div className="text-center py-8 text-slate-700 text-sm">
                      <Paperclip size={24} className="mx-auto mb-2" />
                      Nenhuma evidência adicionada
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {evidences.map((ev) => (
                        <div key={ev.id}
                          className="flex items-center gap-3 bg-[#070d1a] border border-cyan-500/10 rounded-xl px-4 py-3">
                          <div className="flex-shrink-0">{evidenceIcon(ev.mimetype)}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-300 font-medium truncate">{ev.originalName}</p>
                            <p className="text-[10px] text-slate-600">{formatBytes(ev.size)} · {new Date(ev.createdAt).toLocaleDateString("pt-BR")}</p>
                          </div>
                          <a
                            href={`${process.env.NEXT_PUBLIC_API_URL}/evidence/${ev.id}/file`}
                            target="_blank" rel="noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="p-1.5 text-slate-600 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors">
                            <Download size={14} />
                          </a>
                          <button
                            onClick={() => handleDeleteEvidence(ev.id)}
                            className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Badge({ cls, children }: { cls: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[9px] font-black uppercase border tracking-wider ${cls}`}>
      {children}
    </span>
  );
}

function MiniStat({ label, value, color, pulse }: { label: string; value: number; color: string; pulse?: boolean }) {
  const colorMap: Record<string, string> = {
    cyan: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
    red: "bg-red-500/10 border-red-500/20 text-red-400",
    orange: "bg-orange-500/10 border-orange-500/20 text-orange-400",
    green: "bg-green-500/10 border-green-500/20 text-green-400",
  };
  return (
    <div className={`border rounded-xl p-4 ${colorMap[color]}`}>
      <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${pulse && value > 0 ? "animate-pulse" : ""}`}>{value}</p>
    </div>
  );
}
