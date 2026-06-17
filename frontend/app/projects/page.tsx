"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import {
  Radar, Plus, FolderOpen, Shield, Clock, ChevronRight,
  LogOut, AlertTriangle, Trash2, X
} from "lucide-react";

type Project = {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  owner: { id: string; fullname: string; email: string };
  _count: { incidents: number };
  createdAt: string;
};

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [showDelete, setShowDelete] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    // Decode userId from JWT stored in localStorage
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setCurrentUserId(payload.userId);
    } catch {}

    api.get<Project[]>("/projects")
      .then(({ data }) => setProjects(data))
      .catch(() => router.push("/login"))
      .finally(() => setCarregando(false));
  }, []);

  async function handleDelete(id: string) {
    try {
      await api.delete(`/projects/${id}`);
      setProjects(p => p.filter(x => x.id !== id));
    } catch {}
    setShowDelete(null);
  }

  function handleLogout() {
    api.post("/auth/logout").catch(() => {});
    localStorage.removeItem("token");
    router.push("/login");
  }

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
      {/* Sidebar */}
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
          <div className="flex items-center gap-3 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 px-4 py-3 rounded-xl text-sm font-bold">
            <FolderOpen size={16} />
            Projetos
          </div>
        </nav>

        <button onClick={handleLogout}
          className="flex items-center gap-3 text-slate-600 hover:text-red-400 px-4 py-3 rounded-xl text-sm transition-colors group w-full">
          <LogOut size={16} />
          <span>Sair</span>
        </button>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Projetos</h1>
            <p className="text-slate-500 text-sm mt-1">
              {projects.length} projeto{projects.length !== 1 ? "s" : ""} ativos na plataforma
            </p>
          </div>
          <Link href="/projects/new"
            className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-[#070d1a] font-black text-xs px-5 py-3 rounded-xl uppercase tracking-widest transition-all shadow-lg shadow-cyan-500/20">
            <Plus size={15} />
            Novo Projeto
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <StatCard label="Total de Projetos" value={projects.length} icon={<FolderOpen size={18} />} />
          <StatCard label="Total de Incidentes" value={projects.reduce((a, p) => a + p._count.incidents, 0)} icon={<AlertTriangle size={18} />} accent />
          <StatCard label="Projetos sem incidentes" value={projects.filter(p => p._count.incidents === 0).length} icon={<Shield size={18} />} />
        </div>

        {/* Grid */}
        {projects.length === 0 ? (
          <div className="border border-dashed border-cyan-500/20 rounded-2xl p-16 text-center">
            <FolderOpen size={40} className="mx-auto text-slate-700 mb-4" />
            <p className="text-slate-500 font-bold uppercase text-sm tracking-widest">Nenhum projeto criado</p>
            <p className="text-slate-600 text-xs mt-1">Crie o primeiro projeto para começar</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {projects.map((p) => (
              <div key={p.id}
                className="group bg-[#0b1628] border border-cyan-500/10 hover:border-cyan-500/30 rounded-2xl p-6 transition-all hover:bg-[#0f1e38] cursor-pointer flex flex-col"
                onClick={() => router.push(`/projects/${p.id}`)}>
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-cyan-500/10 border border-cyan-500/20 p-2.5 rounded-xl">
                    <FolderOpen size={18} className="text-cyan-400" />
                  </div>
                  {(currentUserId === p.ownerId) && (
                    <button onClick={(e) => { e.stopPropagation(); setShowDelete(p.id); }}
                      className="opacity-0 group-hover:opacity-100 p-2 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <h3 className="font-bold text-white text-lg leading-tight mb-1">{p.name}</h3>
                <p className="text-slate-500 text-sm leading-relaxed line-clamp-2 flex-1 mb-4">{p.description}</p>

                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Shield size={12} className="text-slate-700" />
                      {p.owner.fullname}
                    </span>
                    <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] uppercase ${
                      p._count.incidents > 0
                        ? "bg-red-500/10 text-red-400 border border-red-500/20"
                        : "bg-green-500/10 text-green-400 border border-green-500/20"
                    }`}>
                      {p._count.incidents} incidente{p._count.incidents !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={12} className="text-slate-700" />
                    {new Date(p.createdAt).toLocaleDateString("pt-BR")}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-cyan-500/10 flex items-center justify-between">
                  <span className="text-xs text-slate-600 uppercase font-bold tracking-widest">Ver projeto</span>
                  <ChevronRight size={16} className="text-cyan-500/40 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Delete confirm modal */}
      {showDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b1628] border border-red-500/20 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-500/10 p-2 rounded-xl border border-red-500/20">
                <AlertTriangle size={18} className="text-red-400" />
              </div>
              <h3 className="font-bold text-white">Excluir Projeto</h3>
              <button onClick={() => setShowDelete(null)} className="ml-auto text-slate-600 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <p className="text-slate-400 text-sm mb-6">
              Todos os incidentes e evidências deste projeto serão removidos permanentemente.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 text-sm font-bold hover:border-slate-500 transition-colors">
                Cancelar
              </button>
              <button onClick={() => handleDelete(showDelete)}
                className="flex-1 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold hover:bg-red-500/20 transition-colors">
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, accent }: { label: string; value: number; icon: React.ReactNode; accent?: boolean }) {
  return (
    <div className={`bg-[#0b1628] border rounded-xl p-5 flex items-center gap-4 ${accent ? "border-red-500/20" : "border-cyan-500/10"}`}>
      <div className={`p-3 rounded-xl border ${accent ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-cyan-500/10 border-cyan-500/20 text-cyan-400"}`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-bold text-white leading-none mt-1">{value}</p>
      </div>
    </div>
  );
}
