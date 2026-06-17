"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { Clapperboard, User, Mail, Lock } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    fullname: "",
    email: "",
    password: "",
  });

  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      await api.post("/auth/signup", form);
      router.push("/login");
    } catch (err: any) {
      console.error("Erro no cadastro:", err);
      setErro("Falha ao criar conta. O e-mail pode já estar em uso.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] p-4">
      <div className="bg-white/5 backdrop-blur-md p-8 rounded-2xl shadow-2xl w-full max-w-md border border-white/10">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-slate-800 p-3 rounded-2xl border border-amber-500/30 mb-4 text-amber-400 shadow-inner">
            <Clapperboard size={38} />
          </div>
          <h1 className="text-xl font-black text-white tracking-tight uppercase">
            Nova Conta
          </h1>
          <p className="text-slate-400 text-[9px] font-bold uppercase tracking-[0.4em] mt-1 text-center">
              Crie sua conta para acessar o RadarSec
          </p>
        </div>

        {erro && (
          <p className="mb-4 text-red-400 text-xs text-center font-bold bg-red-900/20 py-2 rounded-lg border border-red-900/30">
            {erro}
          </p>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 ml-1">Nome</label>
            <div className="relative group">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-amber-400" size={16} />
              <input
                type="text"
                required
                value={form.fullname}
                onChange={(e) => setForm({ ...form, fullname: e.target.value })}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white text-sm outline-none focus:ring-2 focus:ring-amber-500 transition-all placeholder:text-slate-600"
                placeholder="Ex: Maria Silva"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 ml-1">E-mail</label>
            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-amber-400" size={16} />
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white text-sm outline-none focus:ring-2 focus:ring-amber-500 transition-all placeholder:text-slate-600"
                placeholder="Admin@radarsec.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 ml-1">Senha</label>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-amber-400" size={16} />
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white text-sm outline-none focus:ring-2 focus:ring-amber-500 transition-all placeholder:text-slate-600"
                placeholder="Mín. 8 chars, letras e símbolos"
              />
            </div>
            <p className="text-slate-600 text-[10px] mt-1 ml-1">
              Mínimo 8 caracteres com maiúsculas, números e símbolo
            </p>
          </div>

          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-amber-500 hover:bg-amber-400 text-black py-3.5 rounded-xl font-black uppercase text-xs tracking-tighter transition-all mt-4 disabled:opacity-50"
          >
            {carregando ? "Criando conta..." : "Criar Conta"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link href="/login" className="text-xs text-slate-500 hover:text-white transition-colors">
            Já tem conta?{" "}
            <span className="text-amber-400 font-bold">Fazer Login</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
