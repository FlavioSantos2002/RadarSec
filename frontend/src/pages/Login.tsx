import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Radar, Lock, Mail } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Preencha todos os campos.'); return; }
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch { setError('Credenciais inválidas. Tente novamente.'); }
    finally { setLoading(false); }
  };

  const inputClass = "w-full bg-[#070d1a] border border-cyan-500/20 rounded-xl p-3 text-white text-sm focus:border-cyan-400 focus:outline-none transition-all pl-10";

  return (
    <div className="min-h-screen bg-[#050912] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="bg-cyan-500/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto border border-cyan-500/20 mb-4">
            <Radar className="text-cyan-400" size={32} />
          </div>
          <h1 className="text-2xl font-black text-white uppercase tracking-widest">RadarSec</h1>
          <p className="text-slate-500 text-xs mt-2 uppercase tracking-widest">Centro de Comando de Ameaças</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#0b1628] border border-cyan-500/10 rounded-2xl p-8 space-y-6 shadow-2xl">
          <h2 className="text-white font-black text-sm uppercase tracking-widest mb-6">Autenticação</h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold p-3 rounded-xl uppercase tracking-widest">
              {error}
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-3 top-3.5 text-slate-600" size={16} />
            <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className={inputClass} />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3.5 text-slate-600" size={16} />
            <input type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" className={inputClass} />
          </div>

          <button type="submit" disabled={loading} 
            className="w-full bg-cyan-500 text-[#070d1a] font-black text-xs px-6 py-4 rounded-xl uppercase tracking-widest hover:bg-cyan-400 transition-all shadow-lg shadow-cyan-500/20">
            {loading ? 'Acessando...' : 'Entrar no Sistema'}
          </button>

          <p className="text-[10px] text-slate-500 text-center uppercase tracking-widest">
            Novo caçador?{' '}
            <Link to="/register" className="text-cyan-400 font-bold hover:underline">Cadastre-se</Link>
          </p>
        </form>

        <p className="text-[9px] text-slate-700 text-center mt-8 uppercase tracking-widest font-bold">
          Autenticação segura via cookie. Sessão protegida.
        </p>
      </div>
    </div>
  );
}