"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api"; // Importando a instância configurada do Axios
import { ShieldAlert, Lock, Mail, ArrowRight } from "lucide-react";

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
      // CHAMADA REAL: Batendo na rota de autenticação do seu backend-node
      const { data } = await api.post("/auth/login", form);
      localStorage.setItem("token", data.token);
      
      // Redireciona para a nova rota de incidentes após sucesso
      router.push("/incidents"); 
    } catch (err: any) {
      console.error("Erro no login:", err);
      setErro("Credenciais inválidas ou erro na conexão com o servidor.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-4">
      <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl shadow-2xl w-full max-w-md border border-white/10">
        <div className="flex flex-col items-center mb-10">
          <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-900/50 mb-4">
            <ShieldAlert size={38} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tighter uppercase">
            Cyber<span className="text-blue-500">Threats</span>
          </h1>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em] mt-1">
            Access Control Panel
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {erro && (
            <p className="text-red-400 text-xs text-center font-bold bg-red-900/20 py-2 rounded-lg border border-red-900/30">
              {erro}
            </p>
          )}

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Credencial de E-mail</label>
            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={18} />
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="analista@cyberthreats.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Chave de Acesso</label>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={18} />
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            {carregando ? "Validando..." : "Autenticar"}
            {!carregando && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>

        <div className="mt-10 pt-6 border-t border-white/5 text-center">
          <p className="text-sm text-slate-500">
            Ainda não possui acesso?{" "}
            <Link href="/signup" className="text-blue-400 font-bold hover:text-blue-300 transition-colors">
              Criar Conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}