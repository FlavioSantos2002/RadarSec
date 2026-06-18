import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import TopBar from '../components/layout/TopBar';
import api from '../api/axios';
import { Project } from '../types';
import { Radar, FileText, ChevronRight } from 'lucide-react';

export default function Reports() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ projects: Project[] }>('/projects')
      .then(({ data }) => setProjects(data.projects))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex min-h-screen bg-[#070d1a]">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopBar title="Relatórios" />
        <main className="p-8">
          <div className="mb-8">
            <h1 className="text-xl font-black text-white uppercase tracking-widest">Relatórios de Segurança</h1>
            <p className="text-slate-500 text-xs mt-2">
              Selecione um projeto para visualizar relatórios detalhados e exportar achados.
            </p>
          </div>

          {loading ? (
             <div className="flex items-center gap-3 text-cyan-400"><Radar size={20} className="animate-spin" /> Carregando...</div>
          ) : (
            <div className="grid gap-3">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="group bg-[#0b1628] border border-cyan-500/10 hover:border-cyan-500/30 rounded-2xl p-5 flex items-center justify-between transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-[#070d1a] border border-cyan-500/10 p-3 rounded-xl">
                      <FileText size={20} className="text-cyan-400" />
                    </div>
                    <div>
                      <p className="font-bold text-white group-hover:text-cyan-400 transition-colors">{project.name}</p>
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-1">
                        {project.findingCount ?? 0} achados registrados
                      </p>
                    </div>
                  </div>
                  <span className="text-cyan-500/40 group-hover:text-cyan-400 transition-all group-hover:translate-x-1">
                    <ChevronRight size={20} />
                  </span>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}