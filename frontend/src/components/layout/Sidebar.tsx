import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROLE_LABELS } from '../../types';
import { Radar, LayoutDashboard, FolderKanban, FileBarChart2 } from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: 'Painel', icon: <LayoutDashboard size={18} /> },
  { to: '/projects', label: 'Projetos', icon: <FolderKanban size={18} /> },
];

export default function Sidebar() {
  const { user, isGestor } = useAuth();

  return (
    <aside className="w-60 bg-[#050912] border-r border-cyan-500/10 flex flex-col min-h-screen">
      {/* Header com destaque */}
      <div className="p-6 border-b border-cyan-500/10">
        <div className="flex items-center gap-3">
          <div className="bg-cyan-500/10 p-2 rounded-lg border border-cyan-500/20">
            <Radar className="text-cyan-400" size={24} />
          </div>
          <div>
            <h1 className="font-black text-white tracking-widest uppercase text-sm">RadarSec</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Plataforma Hunter</p>
          </div>
        </div>
      </div>

      {/* Navegação principal */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-[#0b1628]'
              }`
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
        
        {isGestor && (
          <NavLink
            to="/reports"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-[#0b1628]'
              }`
            }
          >
            <FileBarChart2 size={18} />
            Relatórios
          </NavLink>
        )}
      </nav>

      {/* Footer do Usuário com estilo diferenciado */}
      {user && (
        <div className="p-6 border-t border-cyan-500/10 bg-[#070d1a]">
          <p className="text-xs font-bold text-white truncate">{user.name}</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1 truncate">{user.email}</p>
          <div className="mt-4 bg-[#0b1628] border border-cyan-500/20 text-cyan-400 px-3 py-1 rounded-full text-[9px] font-black uppercase text-center tracking-widest">
            {ROLE_LABELS[user.role]}
          </div>
        </div>
      )}
    </aside>
  );
}