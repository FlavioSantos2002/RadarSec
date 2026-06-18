import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/axios';
import { SearchResult } from '../../types';
import { Search, LogOut, Command, X, ChevronRight } from 'lucide-react';

interface TopBarProps {
  title: string;
}

export default function TopBar({ title }: TopBarProps) {
  const { logout, isGestor } = useAuth();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim() || !isGestor) return;
    setSearching(true);
    try {
      const { data } = await api.get<{ results: SearchResult[] }>('/search', { params: { q } });
      setResults(data.results);
    } catch { setResults([]); } finally { setSearching(false); }
  }, [isGestor]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isGestor) setSearchOpen(true);
      }
      if (e.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isGestor]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2) doSearch(query);
      else setResults([]);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, doSearch]);

  return (
    <>
      <header className="h-16 bg-[#070d1a] border-b border-cyan-500/10 flex items-center justify-between px-8">
        <h1 className="text-sm font-black text-white uppercase tracking-widest">{title}</h1>
        <div className="flex items-center gap-4">
          {isGestor && (
            <button type="button" onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 bg-[#0b1628] border border-cyan-500/20 hover:border-cyan-500/40 text-cyan-400 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg transition-all"
            >
              <Search size={14} /> Busca global
              <span className="flex items-center gap-1 bg-[#070d1a] px-1.5 py-0.5 rounded border border-cyan-500/10 text-slate-500"><Command size={10} /> K</span>
            </button>
          )}
          <button type="button" onClick={() => logout()} className="text-slate-500 hover:text-red-400 transition-colors">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {searchOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center pt-24 px-4" onClick={() => setSearchOpen(false)}>
          <div className="bg-[#0b1628] border border-cyan-500/20 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center px-4 border-b border-cyan-500/10">
              <Search className="text-cyan-500" size={20} />
              <input autoFocus type="text" placeholder="Buscar achados..." value={query} onChange={(e) => setQuery(e.target.value)}
                className="w-full px-4 py-4 bg-transparent text-white placeholder-slate-600 focus:outline-none text-sm" />
              <button onClick={() => setSearchOpen(false)}><X size={20} className="text-slate-500" /></button>
            </div>
            
            <div className="max-h-80 overflow-y-auto p-2">
              {searching && <p className="text-cyan-500/50 text-[10px] uppercase font-black p-3 tracking-widest">Processando requisição...</p>}
              {results.map((r) => (
                <button key={r.id} className="w-full text-left p-3 hover:bg-cyan-500/5 rounded-xl transition-all flex items-center justify-between group"
                  onClick={() => { setSearchOpen(false); navigate(`/projects/${r.project.id}/findings/${r.id}`); }}>
                  <div>
                    <p className="font-bold text-white text-sm group-hover:text-cyan-400 transition-colors">{r.title}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">{r.project.name}</p>
                  </div>
                  <ChevronRight size={16} className="text-cyan-500/30 group-hover:text-cyan-400" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}