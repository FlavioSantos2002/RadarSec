"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { 
  ShieldAlert, LayoutDashboard, User, Trash2, ShieldCheck,
  Plus, X, Clock, ExternalLink, Info, Search, Filter
} from "lucide-react";

// Importações do Recharts para o Dashboard
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend 
} from 'recharts';

type Incident = {
  id: string;
  title: string;
  description: string;
  category: string;
  severity?: string;
  createdAt: string;
};

export default function IncidentesPage() {
  const router = useRouter();
  const [incidentes, setIncidentes] = useState<Incident[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [incidenteSelecionado, setIncidenteSelecionado] = useState<Incident | null>(null);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [erro, setErro] = useState("");
  const [termoBusca, setTermoBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("Todas");

  const [novoIncidente, setNovoIncidente] = useState({
    title: "",
    description: "",
    severity: "Baixa",
  });

  async function carregarIncidentes() {
    try {
      const { data } = await api.get<Incident[]>("/incidents");
      const severidadesSalvas = JSON.parse(localStorage.getItem("cyberthreats_severidades") || "{}");
      const incidentesComSeveridade = data.map(inc => ({
        ...inc,
        severity: severidadesSalvas[inc.id] || "Baixa"
      }));
      setIncidentes(incidentesComSeveridade);
    } catch (err) {
      console.error("Erro ao carregar:", err);
      router.push("/login");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarIncidentes();
  }, []);

  // --- LÓGICA DE FILTRAGEM ---
  const incidentesFiltrados = useMemo(() => {
    const termo = termoBusca.toLowerCase().trim();
    return incidentes.filter((inc) => {
      const titulo = inc.title?.toLowerCase() || "";
      const descricao = inc.description?.toLowerCase() || "";
      const matchesBusca = titulo.includes(termo) || descricao.includes(termo);
      const matchesCategoria = filtroCategoria === "Todas" || inc.category === filtroCategoria;
      return matchesBusca && matchesCategoria;
    });
  }, [incidentes, termoBusca, filtroCategoria]);

  // --- PROCESSAMENTO DE DADOS PARA O DASHBOARD ---
  const stats = useMemo(() => {
    const criticos = incidentesFiltrados.filter(i => i.severity === 'Crítica').length;
    const alta = incidentesFiltrados.filter(i => i.severity === 'Alta').length;
    
    const catMap = incidentesFiltrados.reduce((acc: any, inc) => {
      const label = inc.category?.replace('_', ' ').toUpperCase() || 'PROCESSANDO';
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {});
    const dataPie = Object.keys(catMap).map(name => ({ name, value: catMap[name] }));

    const sevMap: any = { 'Baixa': 0, 'Média': 0, 'Alta': 0, 'Crítica': 0 };
    incidentesFiltrados.forEach(inc => {
      const s = inc.severity || 'Baixa';
      if(sevMap[s] !== undefined) sevMap[s]++;
    });
    const dataBar = Object.keys(sevMap).map(name => ({ name, quantidade: sevMap[name] }));

    return { total: incidentesFiltrados.length, criticos, alta, dataPie, dataBar };
  }, [incidentesFiltrados]);

  const COLORS = ['#3b82f6', '#8b5cf6', '#f97316', '#eab308', '#ef4444', '#64748b'];

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault(); setErro("");
    try {
      let incidentId = editandoId;
      if (editandoId) {
        await api.put(`/incidents/${editandoId}`, { title: novoIncidente.title, description: novoIncidente.description });
      } else {
        const { data } = await api.post("/incidents", { title: novoIncidente.title, description: novoIncidente.description });
        incidentId = data.id;
      }
      if (incidentId) {
        const severidadesAtuais = JSON.parse(localStorage.getItem("cyberthreats_severidades") || "{}");
        severidadesAtuais[incidentId] = novoIncidente.severity;
        localStorage.setItem("cyberthreats_severidades", JSON.stringify(severidadesAtuais));
      }
      setNovoIncidente({ title: "", description: "", severity: "Baixa" });
      setEditandoId(null); setMostrarForm(false); carregarIncidentes();
    } catch (err) { setErro("Erro ao processar incidente no servidor."); }
  }

  async function handleExcluir(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    if (!confirm("Deseja remover este registro?")) return;
    try { await api.delete(`/incidents/${id}`); carregarIncidentes(); } catch (err) { setErro("Erro ao excluir incidente."); }
  }

  const prepararEdicao = (e: React.MouseEvent, inc: Incident) => {
    e.stopPropagation(); setEditandoId(inc.id);
    setNovoIncidente({ title: inc.title, description: inc.description, severity: inc.severity || "Baixa" });
    setMostrarForm(true); window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getCategoryBadge = (cat: string) => {
    const colors: Record<string, string> = {
      phishing: "bg-blue-100 text-blue-700 border-blue-200",
      malware: "bg-purple-100 text-purple-700 border-purple-200",
      brute_force: "bg-orange-100 text-orange-700 border-orange-200",
      ddos: "bg-yellow-100 text-yellow-700 border-yellow-200",
      vazamento_de_dados: "bg-red-100 text-red-700 border-red-200",
    };
    return colors[cat?.toLowerCase()] || "bg-gray-100 text-gray-600";
  };

  const getSeverityColor = (sev: string) => {
    switch(sev) {
      case 'Crítica': return 'bg-red-500';
      case 'Alta': return 'bg-orange-500';
      case 'Média': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };

  if (carregando) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-slate-500 font-medium font-sans">Sincronizando com a rede CyberThreats...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex relative font-sans">
      
      {/* MODAL DE DETALHES */}
      {incidenteSelecionado && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2 text-slate-800">
                <Info size={20} className="text-blue-500" />
                <h2 className="font-bold uppercase text-sm tracking-widest">Detalhes do Incidente</h2>
              </div>
              <button onClick={() => setIncidenteSelecionado(null)} className="p-1 hover:bg-slate-200 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Título</label>
                <p className="text-xl font-bold text-slate-800 leading-tight">{incidenteSelecionado.title}</p>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Classificação</label>
                  {/* AJUSTE AQUI: inline-flex, justify-center e min-w */}
                  <div className={`mt-1 inline-flex items-center justify-center px-3 py-1 rounded-full text-[10px] font-bold uppercase border min-w-[100px] text-center ${getCategoryBadge(incidenteSelecionado.category)}`}>
                    {incidenteSelecionado.category?.replace('_', ' ') || 'Processando'}
                  </div>
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Severidade</label>
                  <div className="mt-1 flex items-center gap-2 font-bold text-slate-700">
                    <div className={`w-3 h-3 rounded-full ${getSeverityColor(incidenteSelecionado.severity || 'Baixa')}`}></div>
                    {incidenteSelecionado.severity || 'Baixa'}
                  </div>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase">Relatório Técnico</label>
                <p className="mt-2 text-slate-600 text-sm leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 whitespace-pre-wrap">
                  {incidenteSelecionado.description}
                </p>
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-[11px] pt-4 border-t">
                <Clock size={14} />
                Registrado em {new Date(incidenteSelecionado.createdAt).toLocaleString("pt-BR")}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col p-6 shadow-xl">
        <div className="flex items-center gap-2 text-blue-400 mb-10">
          <ShieldAlert size={28} />
          <h2 className="text-xl font-bold tracking-tight text-white uppercase">Cyber<span className="text-blue-500">Threats</span></h2>
        </div>
        <nav className="space-y-2 flex-1">
          <div className="flex items-center gap-3 bg-blue-600/20 text-blue-400 p-3 rounded-lg border border-blue-600/30">
            <LayoutDashboard size={18} />
            <span className="font-medium">Incidentes</span>
          </div>
          <div onClick={() => alert("Perfil em desenvolvimento.")} className="flex items-center gap-3 text-slate-400 p-3 hover:bg-slate-800 rounded-lg transition-all cursor-pointer group">
            <User size={18} className="group-hover:text-blue-400" />
            <span>Meu Perfil</span>
          </div>
        </nav>
        <div className="pt-6 border-t border-slate-800">
           <button onClick={async () => { try { await api.post("/auth/logout"); } finally { localStorage.removeItem("token"); router.push("/login"); } }} className="flex items-center gap-3 text-slate-400 hover:text-red-400 w-full p-3 transition-colors group">
             <LogOut size={18} /> <span className="font-medium">Sair do Sistema</span>
           </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-y-auto">
        <header className="bg-white border-b px-8 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-2">
             <div className="bg-blue-50 p-2 rounded-lg text-blue-600 mr-1"><ShieldCheck size={20} /></div>
             <h1 className="text-lg font-bold text-slate-800 tracking-tight">Gestor de Incidentes</h1>
          </div>
        </header>

        <main className="p-8 max-w-6xl mx-auto w-full space-y-6">
          {/* CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard title="Total Detectado" value={stats.total} icon={<LayoutDashboard size={20}/>} color="text-blue-600" />
            <StatCard title="Críticos" value={stats.criticos} icon={<ShieldAlert size={20}/>} color="text-red-600" isAlert={stats.criticos > 0} />
            <StatCard title="Severidade Alta" value={stats.alta} icon={<Info size={20}/>} color="text-orange-600" />
            <StatCard title="Monitoramento" value="ATIVO" icon={<ShieldCheck size={20}/>} color="text-green-600" />
          </div>

          {/* GRÁFICOS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-[300px]">
              <h3 className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest text-center">Ameaças por Categoria</h3>
              <ResponsiveContainer width="100%" height="85%">
                <PieChart>
                  <Pie data={stats.dataPie} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {stats.dataPie.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-[300px]">
              <h3 className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest text-center">Volume por Severidade</h3>
              <ResponsiveContainer width="100%" height="85%">
                <BarChart data={stats.dataBar}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={10} fontWeight="bold" />
                  <YAxis fontSize={10} />
                  <Tooltip />
                  <Bar dataKey="quantidade" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* FORMULÁRIO */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <button onClick={() => setMostrarForm(!mostrarForm)} className="w-full px-6 py-4 text-left font-medium text-slate-700 flex justify-between items-center hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-2">
                {mostrarForm ? <X size={18} className="text-red-500" /> : <Plus size={18} className="text-blue-500" />}
                {mostrarForm ? "Cancelar Operação" : "Registrar Novo Incidente"}
              </div>
            </button>
            {mostrarForm && (
              <div className="p-6 border-t bg-slate-50/50">
                <form className="grid grid-cols-2 gap-6" onSubmit={handleSalvar}>
                  <div className="col-span-2 md:col-span-1">
                    <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">Título</label>
                    <input required value={novoIncidente.title} onChange={e => setNovoIncidente({...novoIncidente, title: e.target.value})} className="w-full border border-slate-300 rounded-lg px-4 py-2 bg-white outline-none" />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">Severidade</label>
                    <select value={novoIncidente.severity} onChange={e => setNovoIncidente({...novoIncidente, severity: e.target.value})} className="w-full border border-slate-300 rounded-lg px-4 py-2 bg-white outline-none">
                      <option>Baixa</option><option>Média</option><option>Alta</option><option>Crítica</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">Descrição</label>
                    <textarea required rows={2} value={novoIncidente.description} onChange={e => setNovoIncidente({...novoIncidente, description: e.target.value})} className="w-full border border-slate-300 rounded-lg px-4 py-2 bg-white outline-none" />
                  </div>
                  <div className="col-span-2 flex justify-end">
                    <button type="submit" className="bg-blue-600 text-white px-8 py-2 rounded-lg font-bold hover:bg-blue-700 shadow-md">
                      {editandoId ? "Atualizar" : "Registrar"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* BUSCA E TABELA */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="md:col-span-3 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="text" placeholder="Filtrar eventos..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm" value={termoBusca} onChange={(e) => setTermoBusca(e.target.value)} />
            </div>
            <select className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm font-medium text-slate-600" value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}>
              <option value="Todas">Todas Categorias</option>
              {Array.from(new Set(incidentes.map(i => i.category))).filter(Boolean).map(cat => (
                <option key={cat} value={cat}>{cat.replace('_', ' ').toUpperCase()}</option>
              ))}
            </select>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b bg-slate-50/50 flex justify-between items-center">
               <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Histórico Real-Time</h3>
               <span className="text-[10px] text-slate-400 font-black">EXIBINDO {incidentesFiltrados.length} REGISTROS</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white border-b text-slate-400 text-[11px] uppercase font-black">
                    <th className="px-6 py-4">Incidente</th>
                    <th className="px-6 py-4 text-center">Classificação</th>
                    <th className="px-6 py-4 text-center">Severidade</th>
                    <th className="px-6 py-4 text-center">Data</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {incidentesFiltrados.map((inc) => (
                    <tr key={inc.id} onClick={() => setIncidenteSelecionado(inc)} className="hover:bg-blue-50/40 transition-colors cursor-pointer group">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800 flex items-center gap-2">{inc.title} <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 text-blue-400" /></div>
                        <div className="text-xs text-slate-500 truncate max-w-[200px]">{inc.description}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {/* AJUSTE PREVENTIVO NA TABELA TAMBÉM */}
                        <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[9px] font-black uppercase border shadow-sm min-w-[85px] text-center ${getCategoryBadge(inc.category)}`}>
                          {inc.category?.replace('_', ' ') || 'IA...'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                           <div className={`w-2 h-2 rounded-full ${getSeverityColor(inc.severity || 'Baixa')} ${inc.severity === 'Crítica' ? 'animate-pulse' : ''}`}></div>
                           <span className="text-xs font-semibold text-slate-600">{inc.severity || 'Baixa'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[10px] text-slate-400 text-center font-bold uppercase">{new Date(inc.createdAt).toLocaleDateString("pt-BR")}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={(e) => prepararEdicao(e, inc)} className="p-2 text-slate-300 hover:text-blue-500 rounded-lg hover:bg-white"><Plus size={16} className="rotate-45" /></button>
                          <button onClick={(e) => handleExcluir(e, inc.id)} className="p-2 text-slate-300 hover:text-red-500 rounded-lg hover:bg-white"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color, isAlert }: any) {
  return (
    <div className={`bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 ${isAlert ? 'ring-2 ring-red-500/20' : ''}`}>
      <div className={`p-3 rounded-lg bg-slate-50 ${color}`}>{icon}</div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
        <p className="text-2xl font-bold text-slate-800 leading-none mt-1">{value}</p>
      </div>
    </div>
  );
}

function LogOut({size}: {size:number}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
  );
}