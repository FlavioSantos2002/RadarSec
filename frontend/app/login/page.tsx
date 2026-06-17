"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { Clapperboard, Lock, Mail, ArrowRight } from "lucide-react";

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
      const { data } = await api.post("/auth/login", form);
      localStorage.setItem("token", data.token);
      localStorage.setItem("plottwister_user", JSON.stringify(data.user));
      router.push("/sessions");
    } catch (err: any) {
      console.error("Erro no login:", err);
      setErro("Credenciais inválidas ou erro na conexão com o servidor.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] p-4">
      <div className="bg-white/5 backdrop-blur-md p-8 rounded-2xl shadow-2xl w-full max-w-md border border-white/10">
        <div className="flex flex-col items-center mb-10">
          <div className="bg-amber-500 p-3 rounded-2xl shadow-lg shadow-amber-900/50 mb-4">
            <Clapperboard size={38} className="text-black" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tighter uppercase">
            <span className="text-amber-400">RadarSec</span>
          </h1>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em] mt-1">
            O radar da sua segurança
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {erro && (
            <p className="text-red-400 text-xs text-center font-bold bg-red-900/20 py-2 rounded-lg border border-red-900/30">
              {erro}
            </p>
          )}

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">E-mail</label>
            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-amber-400 transition-colors" size={18} />
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                placeholder="Admin@radarsec.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Senha</label>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-amber-400 transition-colors" size={18} />
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-amber-500 hover:bg-amber-400 text-black py-4 rounded-xl font-black uppercase text-xs tracking-widest transition-all shadow-lg shadow-amber-900/30 flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            {carregando ? "Entrando..." : "Entrar"}
            {!carregando && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>

        <div className="mt-10 pt-6 border-t border-white/5 text-center">
          <p className="text-sm text-slate-500">
            Ainda não tem conta?{" "}
            <Link href="/signup" className="text-amber-400 font-bold hover:text-amber-300 transition-colors">
              Criar Conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
