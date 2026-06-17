"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { User, Mail, Lock, Radar } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ fullname: "", email: "", password: "" });
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    try {
      await api.post("/auth/signup", form);
      router.push("/login");
    } catch {
      setErro("Falha ao criar conta. O e-mail pode já estar em uso.");
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

          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-xl" />
              <div className="relative bg-[#0d1e3a] border border-cyan-500/30 p-4 rounded-2xl">
                <Radar size={34} className="text-cyan-400" />
              </div>
            </div>
            <h1 className="text-xl font-black text-white tracking-tighter uppercase">
              Radar<span className="text-cyan-400">Sec</span>
            </h1>
            <p className="text-slate-500 text-[9px] font-bold uppercase tracking-[0.4em] mt-1">
              Novo Analista
            </p>
          </div>

          {erro && (
            <p className="mb-4 text-red-400 text-xs text-center font-bold bg-red-900/20 py-2 rounded-lg border border-red-900/30">
              {erro}
            </p>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 ml-1 tracking-widest">Nome Completo</label>
              <div className="relative group">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-cyan-400 transition-colors" size={16} />
                <input type="text" required value={form.fullname}
                  onChange={(e) => setForm({ ...form, fullname: e.target.value })}
                  className="w-full bg-[#070d1a] border border-slate-700/60 rounded-xl pl-10 pr-4 py-3 text-slate-100 text-sm outline-none focus:ring-1 focus:ring-cyan-500/60 focus:border-cyan-500/40 transition-all placeholder:text-slate-700"
                  placeholder="Ex: Ana Lima" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 ml-1 tracking-widest">E-mail</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-cyan-400 transition-colors" size={16} />
                <input type="email" required value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-[#070d1a] border border-slate-700/60 rounded-xl pl-10 pr-4 py-3 text-slate-100 text-sm outline-none focus:ring-1 focus:ring-cyan-500/60 focus:border-cyan-500/40 transition-all placeholder:text-slate-700"
                  placeholder="analista@radarsec.io" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 ml-1 tracking-widest">Senha</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-cyan-400 transition-colors" size={16} />
                <input type="password" required value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-[#070d1a] border border-slate-700/60 rounded-xl pl-10 pr-4 py-3 text-slate-100 text-sm outline-none focus:ring-1 focus:ring-cyan-500/60 focus:border-cyan-500/40 transition-all placeholder:text-slate-700"
                  placeholder="••••••••" />
              </div>
            </div>

            <button type="submit" disabled={carregando}
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-[#070d1a] py-3.5 rounded-xl font-black uppercase text-xs tracking-widest transition-all shadow-lg shadow-cyan-500/20 mt-2 disabled:opacity-50">
              {carregando ? "Criando conta..." : "Criar Conta"}
            </button>
          </form>

          <div className="mt-8 text-center">
            <Link href="/login" className="text-xs text-slate-600 hover:text-slate-300 transition-colors">
              Já tem acesso?{" "}<span className="text-cyan-400 font-bold">Fazer login</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}