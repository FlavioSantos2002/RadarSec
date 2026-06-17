"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { Radar, ArrowLeft, FolderOpen } from "lucide-react";

export default function NewProjectPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", description: "" });
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    try {
      await api.post("/projects", form);
      router.push("/projects");
    } catch {
      setErro("Erro ao criar projeto. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#070d1a] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#070d1a] border-r border-cyan-500/10 flex flex-col p-6 sticky top-0 h-screen scanlines">
        <div className="flex items-center gap-2 mb-10">
          <div className="bg-[#0d1e3a] border border-cyan-500/30 p-2 rounded-xl">
            <Radar size={22} className="text-cyan-400" />
          </div>
          <span className="text-lg font-black text-white tracking-tighter uppercase">
            Radar<span className="text-cyan-400">Sec</span>
          </span>
        </div>
        <Link href="/projects" className="flex items-center gap-2 text-slate-500 hover:text-cyan-400 text-sm transition-colors">
          <ArrowLeft size={15} />
          Voltar para Projetos
        </Link>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8 max-w-2xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-cyan-500/10 border border-cyan-500/20 p-2 rounded-xl">
              <FolderOpen size={18} className="text-cyan-400" />
            </div>
            <h1 className="text-xl font-black text-white tracking-tight uppercase">Novo Projeto</h1>
          </div>
          <p className="text-slate-500 text-sm ml-12">Você ficará marcado como responsável pelo projeto</p>
        </div>

        <div className="bg-[#0b1628] border border-cyan-500/10 rounded-2xl p-8">
          {erro && (
            <p className="mb-5 text-red-400 text-xs font-bold bg-red-900/20 py-2 px-4 rounded-xl border border-red-900/30">
              {erro}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">
                Nome do Projeto
              </label>
              <input
                type="text" required minLength={3} maxLength={100}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-[#070d1a] border border-slate-700/60 rounded-xl px-4 py-3 text-slate-100 text-sm outline-none focus:ring-1 focus:ring-cyan-500/60 focus:border-cyan-500/40 transition-all placeholder:text-slate-700"
                placeholder="Ex: Pentest Infrastructure Q3"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">
                Descrição
              </label>
              <textarea
                required minLength={1} rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full bg-[#070d1a] border border-slate-700/60 rounded-xl px-4 py-3 text-slate-100 text-sm outline-none focus:ring-1 focus:ring-cyan-500/60 focus:border-cyan-500/40 transition-all placeholder:text-slate-700 resize-none"
                placeholder="Descreva o escopo e objetivos do projeto..."
              />
            </div>

            <div className="flex gap-4 pt-2">
              <Link href="/projects"
                className="flex-1 py-3 text-center rounded-xl border border-slate-700 text-slate-400 text-sm font-bold hover:border-slate-500 transition-colors">
                Cancelar
              </Link>
              <button type="submit" disabled={carregando}
                className="flex-1 py-3 bg-cyan-500 hover:bg-cyan-400 text-[#070d1a] rounded-xl font-black uppercase text-xs tracking-widest transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50">
                {carregando ? "Criando..." : "Criar Projeto"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
