import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Radar, Plus, FolderOpen, AlertTriangle, Shield } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import TopBar from '../components/layout/TopBar';
import SeverityBadge from '../components/findings/SeverityBadge';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import { Project, Severity } from '../types';

export default function Projects() {
  const { isGestor } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newScope, setNewScope] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchProjects = () => {
    api.get<{ projects: Project[] }>('/projects')
      .then(({ data }) => setProjects(data.projects))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await api.post('/projects', { name: newName, description: newDescription || undefined, scope: newScope || undefined });
      setShowCreate(false);
      setNewName(''); setNewDescription(''); setNewScope('');
      fetchProjects();
    } finally { setCreating(false); }
  };

  return (
    <div className="flex min-h-screen bg-[#070d1a]">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopBar title="Projetos" />
        <main className="p-8">
          <div className="flex justify-between items-center mb-8">
            <p className="text-slate-500 text-sm uppercase tracking-widest font-black">{projects.length} projeto(s)</p>
            {isGestor && (
              <button type="button" onClick={() => setShowCreate(true)} 
                className="bg-cyan-500 text-[#070d1a] font-black text-xs px-6 py-3 rounded-xl uppercase tracking-widest hover:bg-cyan-400 transition-all shadow-lg shadow-cyan-500/20">
                + Novo Projeto
              </button>
            )}
          </div>

          {loading ? (
             <div className="flex items-center gap-3 text-cyan-400"><Radar size={20} className="animate-spin" /> Carregando...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {projects.map((project) => (
                <Link key={project.id} to={`/projects/${project.id}`}
                  className="group bg-[#0b1628] border border-cyan-500/10 hover:border-cyan-500/30 rounded-2xl p-6 transition-all hover:bg-[#0f1e38] flex flex-col justify-between"
                >
                  {/* Cabeçalho: Nome e Escopo */}
                  <div className="mb-6">
                    <h3 className="font-black text-white text-lg mb-1 group-hover:text-cyan-400 transition-colors">{project.name}</h3>
                    <p className="font-mono text-[10px] text-cyan-500/60 truncate">{project.scope || "Sem escopo definido"}</p>
                  </div>

                  {/* Corpo: Estatísticas (Layout em Grid) */}
                  <div className="grid grid-cols-2 gap-4 mb-6 border-t border-cyan-500/10 pt-4">
                    <div>
                      <p className="text-[10px] font-black text-slate-600 uppercase">Membros</p>
                      <p className="text-sm text-slate-300 font-bold">{project.memberCount ?? 0}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-600 uppercase">Achados</p>
                      <p className="text-sm text-slate-300 font-bold">{project.findingCount ?? 0}</p>
                    </div>
                  </div>

                  {/* Rodapé: Severidades (Barra de status simplificada) */}
                  {project.severityCounts && (
                    <div className="flex gap-3">
                      {(Object.entries(project.severityCounts) as [Severity, number][])
                        .filter(([, count]) => count > 0)
                        .map(([severity, count]) => (
                          <div key={severity} className="flex items-center gap-1.5">
                            <SeverityBadge severity={severity} />
                            <span className="text-[10px] font-black text-slate-500">{count}</span>
                          </div>
                        ))}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Modal de Criação RadarSec */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b1628] border border-cyan-500/20 rounded-2xl p-8 max-w-lg w-full">
            <h2 className="text-white font-black text-lg mb-6 uppercase tracking-widest">Novo Projeto</h2>
            <div className="space-y-4">
              <input type="text" placeholder="Nome do projeto *" value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full bg-[#070d1a] border border-cyan-500/20 rounded-xl p-3 text-white text-sm" />
              <textarea placeholder="Descrição" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} rows={2} className="w-full bg-[#070d1a] border border-cyan-500/20 rounded-xl p-3 text-white text-sm" />
              <input type="text" placeholder="Escopo (alvos)" value={newScope} onChange={(e) => setNewScope(e.target.value)} className="w-full bg-[#070d1a] border border-cyan-500/20 rounded-xl p-3 text-white text-sm" />
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setShowCreate(false)} className="text-slate-500 font-bold text-xs uppercase tracking-widest hover:text-white">Cancelar</button>
              <button onClick={handleCreate} disabled={creating} className="bg-cyan-500 text-[#070d1a] font-black text-xs px-6 py-3 rounded-xl uppercase tracking-widest hover:bg-cyan-400">
                {creating ? 'Criando...' : 'Criar Projeto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}