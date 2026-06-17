"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { Lock, Mail, ArrowRight, Radar } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    try {
      const resposta = await api.post("/auth/login", form);

      const token = resposta.data.token || resposta.data; 
      localStorage.setItem("token", token);
      
      router.push("/projects");
    } catch {
      setErro("Credenciais inválidas ou erro na conexão com o servidor.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070d1a] p-4">
      <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTSAwIDQwIEwgNDAgNDAgTCA0MCAwIiBmaWxsPSJub25lIiBzdHJva2U9InJnYmEoMzQsMjExLDIzOCwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9zdmc+')] opacity-60 pointer-events-none" />

      <div className="relative w-full max-w-md">
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-cyan-500/20 to-transparent pointer-events-none" />

        <div className="relative bg-[#0b1628] border border-cyan-500/10 rounded-2xl p-8 shadow-2xl">
          <div className="flex flex-col items-center mb-10">
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-xl" />
              <div className="relative bg-[#0d1e3a] border border-cyan-500/30 p-4 rounded-2xl">
                <Radar size={36} className="text-cyan-400" />
              </div>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tighter uppercase">
              Radar<span className="text-cyan-400">Sec</span>
            </h1>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em] mt-1">
              Security Operations Center
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {erro && (
              <p className="text-red-400 text-xs text-center font-bold bg-red-900/20 py-2 rounded-lg border border-red-900/30">
                {erro}
              </p>
            )}

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-1 tracking-widest">E-mail</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-cyan-400 transition-colors" size={16} />
                <input
                  type="email" required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-[#070d1a] border border-slate-700/60 rounded-xl pl-10 pr-4 py-3 text-slate-100 text-sm placeholder:text-slate-700 focus:ring-1 focus:ring-cyan-500/60 focus:border-cyan-500/40 outline-none transition-all"
                  placeholder="analista@radarsec.io"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-1 tracking-widest">Senha</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-cyan-400 transition-colors" size={16} />
                <input
                  type="password" required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-[#070d1a] border border-slate-700/60 rounded-xl pl-10 pr-4 py-3 text-slate-100 text-sm placeholder:text-slate-700 focus:ring-1 focus:ring-cyan-500/60 focus:border-cyan-500/40 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={carregando}
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-[#070d1a] py-3.5 rounded-xl font-black uppercase text-xs tracking-widest transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 group disabled:opacity-50 mt-2"
            >
              {carregando ? "Autenticando..." : "Acessar Plataforma"}
              {!carregando && <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-sm text-slate-600">
              Sem acesso?{" "}
              <Link href="/signup" className="text-cyan-400 font-bold hover:text-cyan-300 transition-colors">
                Solicitar cadastro
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}