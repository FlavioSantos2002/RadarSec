import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FolderOpen, AlertTriangle, Shield, Radar } from 'lucide-react'; 
import Sidebar from '../components/layout/Sidebar'; // Sidebar original restaurada
import TopBar from '../components/layout/TopBar';     // TopBar original restaurada
import api from '../api/axios';
import { DashboardStats } from '../types';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<DashboardStats>('/projects/dashboard')
      .then(({ data }) => setStats(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#070d1a] flex items-center justify-center">
      <div className="flex items-center gap-3 text-cyan-400">
        <Radar size={20} className="animate-spin" />
        <span className="text-sm font-bold tracking-widest uppercase">Carregando...</span>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#070d1a]">
      {/* Sidebar restaurada */}
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        {/* TopBar restaurada */}
        <TopBar title="Painel" />
        
        <main className="p-8">
          {stats && (
            <>
              {/* Cards Estilo Versão A (Visual) com Lógica da Versão B */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
                <StatCard label="Total de Projetos" value={stats.projectCount} icon={<FolderOpen size={18} />} />
                <StatCard label="Total de Achados" value={stats.findingCount} icon={<AlertTriangle size={18} />} />
                <StatCard label="Críticos em Aberto" value={stats.criticalOpen} icon={<Shield size={18} />} accent />
              </div>

              <div>
                <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Projetos Recentes</h2>
                {stats.recentProjects.length === 0 ? (
                  <p className="text-slate-600 text-sm">Nenhum projeto encontrado.</p>
                ) : (
                  <div className="grid gap-3">
                    {stats.recentProjects.map((project) => (
                      <Link key={project.id} to={`/projects/${project.id}`}
                        className="group bg-[#0b1628] border border-cyan-500/10 hover:border-cyan-500/30 rounded-2xl p-5 flex items-center justify-between transition-all"
                      >
                        <div>
                          <p className="font-bold text-white">{project.name}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {project._count?.findings ?? 0} achados · {project._count?.members ?? 0} membros
                          </p>
                        </div>
                        <span className="text-cyan-500/40 group-hover:text-cyan-400 transition-colors">→</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

// StatCard helper permanece idêntico ao que criamos
function StatCard({ label, value, icon, accent }: { label: string; value: number; icon: React.ReactNode; accent?: boolean }) {
  return (
    <div className={`bg-[#0b1628] border rounded-2xl p-6 flex items-center gap-4 ${accent ? "border-red-500/20" : "border-cyan-500/10"}`}>
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