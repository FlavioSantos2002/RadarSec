"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import {
  Clapperboard, Film, Plus, X, Play, ChevronRight, LogOut,
  Check, Clock, Trophy, Loader2, Pause, Users,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type SessionStatus = "waiting" | "active" | "finished";

type Choice = {
  id: string;
  text: string;
  _count?: { votes: number };
};

type Scene = {
  id: string;
  title: string;
  content: string;
  order: number;
  isActive: boolean;
  choices: Choice[];
  _count?: { votes: number };
};

type Session = {
  id: string;
  title: string;
  description: string;
  status: SessionStatus;
  director: { id: string; fullname: string };
  _count?: { scenes: number };
  scenes?: Scene[];
};

type StoredUser = {
  id: string;
  fullname: string;
  role: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<SessionStatus, { label: string; color: string; dot: string }> = {
  waiting: {
    label: "Aguardando",
    color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    dot: "bg-yellow-400",
  },
  active: {
    label: "Em Andamento",
    color: "bg-green-500/15 text-green-400 border-green-500/30",
    dot: "bg-green-400",
  },
  finished: {
    label: "Encerrada",
    color: "bg-slate-500/15 text-slate-400 border-slate-500/30",
    dot: "bg-slate-500",
  },
};

const ROLE_CONFIG: Record<string, { label: string; color: string }> = {
  director: { label: "Diretor", color: "text-amber-400 bg-amber-400/10 border-amber-400/30" },
  moderator: { label: "Moderador", color: "text-blue-400 bg-blue-400/10 border-blue-400/30" },
  viewer: { label: "Espectador", color: "text-slate-400 bg-slate-400/10 border-slate-400/30" },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function SessionsPage() {
  const router = useRouter();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [selected, setSelected] = useState<Session | null>(null);
  const [user, setUser] = useState<StoredUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [userVotes, setUserVotes] = useState<Record<string, string>>({});
  const [votingId, setVotingId] = useState<string | null>(null);
  const [erro, setErro] = useState("");

  // Forms state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showSceneForm, setShowSceneForm] = useState(false);
  const [newSession, setNewSession] = useState({ title: "", description: "" });
  const [newScene, setNewScene] = useState({ title: "", content: "", choices: ["", ""] });

  // ─── Init ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("plottwister_user");
    if (!token || !storedUser) {
      router.push("/login");
      return;
    }
    setUser(JSON.parse(storedUser));
    loadSessions();
  }, []);

  const isDirector = user?.role === "director";
  const isModerator = user?.role === "moderator" || user?.role === "director";

  // ─── Data loading ─────────────────────────────────────────────────────────

  const loadSessions = async () => {
    try {
      const { data } = await api.get<Session[]>("/sessions");
      setSessions(data);
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const selectSession = async (s: Session) => {
    setLoadingDetail(true);
    setSelected(null);
    setErro("");
    try {
      const { data } = await api.get<Session>(`/sessions/${s.id}`);
      setSelected(data);
    } catch {
      setErro("Erro ao carregar sessão.");
    } finally {
      setLoadingDetail(false);
    }
  };

  const refreshSelected = async () => {
    if (selected) await selectSession(selected);
  };

  // ─── Session actions ──────────────────────────────────────────────────────

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    try {
      await api.post("/sessions", newSession);
      setNewSession({ title: "", description: "" });
      setShowCreateForm(false);
      loadSessions();
    } catch {
      setErro("Erro ao criar sessão.");
    }
  };

  const handleUpdateStatus = async (status: SessionStatus) => {
    if (!selected) return;
    setErro("");
    try {
      await api.patch(`/sessions/${selected.id}/status`, { status });
      await refreshSelected();
      loadSessions();
    } catch {
      setErro("Erro ao atualizar status.");
    }
  };

  const handleDeleteSession = async () => {
    if (!selected || !confirm(`Excluir a sessão "${selected.title}"?`)) return;
    try {
      await api.delete(`/sessions/${selected.id}`);
      setSelected(null);
      loadSessions();
    } catch {
      setErro("Erro ao excluir sessão.");
    }
  };

  // ─── Scene actions ────────────────────────────────────────────────────────

  const handleAddScene = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    const validChoices = newScene.choices.filter((c) => c.trim().length > 0);
    if (validChoices.length < 2) {
      setErro("Adicione pelo menos 2 opções de escolha.");
      return;
    }
    setErro("");
    try {
      await api.post(`/sessions/${selected.id}/scenes`, { ...newScene, choices: validChoices });
      setNewScene({ title: "", content: "", choices: ["", ""] });
      setShowSceneForm(false);
      await refreshSelected();
    } catch {
      setErro("Erro ao adicionar cena.");
    }
  };

  const handleActivateScene = async (sceneId: string) => {
    if (!selected) return;
    setErro("");
    try {
      await api.patch(`/sessions/${selected.id}/scenes/${sceneId}/activate`);
      await refreshSelected();
    } catch {
      setErro("Erro ao ativar cena.");
    }
  };

  // ─── Vote ─────────────────────────────────────────────────────────────────

  const handleVote = async (sceneId: string, choiceId: string) => {
    setVotingId(sceneId);
    setErro("");
    try {
      await api.post("/sessions/vote", { sceneId, choiceId });
      setUserVotes((prev) => ({ ...prev, [sceneId]: choiceId }));
      await refreshSelected();
    } catch (err: any) {
      setErro(err.response?.data?.msg || "Erro ao registrar voto.");
    } finally {
      setVotingId(null);
    }
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const totalVotes = (scene: Scene) =>
    scene.choices.reduce((acc, c) => acc + (c._count?.votes || 0), 0);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("plottwister_user");
    router.push("/login");
  };

  const activeScene = selected?.scenes?.find((s) => s.isActive);

  // ─── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] text-amber-400 gap-3">
        <Loader2 className="animate-spin" size={24} />
        <span className="font-bold tracking-widest text-sm uppercase">Carregando PlotTwister...</span>
      </div>
    );
  }

  const roleInfo = ROLE_CONFIG[user?.role ?? "viewer"];

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col text-white">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="bg-[#0e0e16] border-b border-white/5 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Clapperboard size={26} className="text-amber-400" />
          <div>
            <h1 className="font-black text-white tracking-tight leading-none">
              Plot<span className="text-amber-400">Twister</span>
            </h1>
            <p className="text-[9px] text-slate-600 uppercase tracking-[0.3em]">Cinema Interativo</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {user && (
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-white">{user.fullname}</p>
              <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${roleInfo.color}`}>
                {roleInfo.label}
              </span>
            </div>
          )}
          <button onClick={logout} className="flex items-center gap-1.5 text-slate-500 hover:text-white text-sm transition-colors">
            <LogOut size={15} />
            <span className="hidden sm:inline text-xs">Sair</span>
          </button>
        </div>
      </header>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 65px)" }}>

        {/* ── Sidebar ──────────────────────────────────────────────────────── */}
        <aside className="w-72 bg-[#0c0c14] border-r border-white/5 flex flex-col overflow-hidden shrink-0">
          <div className="p-4 border-b border-white/5">
            {isDirector ? (
              <button
                onClick={() => setShowCreateForm(true)}
                className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm py-2.5 rounded-xl transition-colors"
              >
                <Plus size={16} /> Nova Sessão
              </button>
            ) : (
              <div className="flex items-center justify-center gap-2 text-slate-600 text-xs">
                <Users size={14} />
                <span>{sessions.length} sessão(ões)</span>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {sessions.length === 0 && (
              <p className="text-slate-700 text-xs text-center mt-8">Nenhuma sessão disponível</p>
            )}
            {sessions.map((s) => {
              const cfg = STATUS_CONFIG[s.status];
              const isSelected = selected?.id === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => selectSession(s)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    isSelected
                      ? "bg-amber-500/10 border-amber-500/30"
                      : "bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className={`font-bold text-sm truncate leading-tight ${isSelected ? "text-amber-300" : "text-white"}`}>
                      {s.title}
                    </p>
                    <div className={`shrink-0 w-2 h-2 rounded-full mt-1 ${cfg.dot} ${s.status === "active" ? "animate-pulse" : ""}`} />
                  </div>
                  <p className="text-slate-600 text-[11px] mt-1">{s.director.fullname}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full border ${cfg.color}`}>
                      {cfg.label}
                    </span>
                    <span className="text-[10px] text-slate-700">{s._count?.scenes || 0} cenas</span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* ── Main ─────────────────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto p-6">

          {/* Erro global */}
          {erro && (
            <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl flex items-center justify-between">
              <span>{erro}</span>
              <button onClick={() => setErro("")}><X size={16} /></button>
            </div>
          )}

          {/* Loading */}
          {loadingDetail && (
            <div className="flex items-center justify-center h-64 text-slate-600 gap-3">
              <Loader2 className="animate-spin" size={20} />
            </div>
          )}

          {/* Empty state */}
          {!selected && !loadingDetail && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4">
              <Film size={72} className="text-slate-800" />
              <div>
                <p className="text-slate-500 font-semibold">Selecione uma sessão ao lado</p>
                <p className="text-slate-700 text-sm mt-1">
                  {isDirector ? "ou crie uma nova sessão para começar" : "para acompanhar e votar na história"}
                </p>
              </div>
            </div>
          )}

          {/* Session detail */}
          {selected && !loadingDetail && (
            <div className="max-w-2xl mx-auto space-y-5">

              {/* ── Session header ───────────────────────────────────────── */}
              <div className="bg-[#0e0e16] border border-white/5 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-black text-white leading-tight">{selected.title}</h2>
                    <p className="text-slate-400 text-sm mt-1 leading-relaxed">{selected.description}</p>
                    <p className="text-slate-700 text-xs mt-2 flex items-center gap-1">
                      <Clock size={11} /> {selected.director.fullname}
                    </p>
                  </div>
                  <span className={`shrink-0 text-[9px] font-black uppercase px-2.5 py-1 rounded-full border ${STATUS_CONFIG[selected.status].color}`}>
                    {STATUS_CONFIG[selected.status].label}
                  </span>
                </div>

                {/* Director controls */}
                {isDirector && (
                  <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap gap-2">
                    {selected.status === "waiting" && (
                      <button
                        onClick={() => handleUpdateStatus("active")}
                        className="flex items-center gap-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <Play size={11} /> Iniciar Sessão
                      </button>
                    )}
                    {selected.status === "active" && (
                      <button
                        onClick={() => handleUpdateStatus("finished")}
                        className="flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <Trophy size={11} /> Encerrar Sessão
                      </button>
                    )}
                    <button
                      onClick={() => setShowSceneForm(true)}
                      className="flex items-center gap-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Plus size={11} /> Adicionar Cena
                    </button>
                    <button
                      onClick={handleDeleteSession}
                      className="flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ml-auto"
                    >
                      <X size={11} /> Excluir
                    </button>
                  </div>
                )}
              </div>

              {/* ── Active voting scene (viewers) ─────────────────────────── */}
              {activeScene && !isDirector && (
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-amber-400 text-xs font-black uppercase tracking-widest">
                      Votação em Andamento
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-white mb-1">{activeScene.title}</h3>
                  <p className="text-slate-300 text-sm leading-relaxed mb-5">{activeScene.content}</p>

                  {userVotes[activeScene.id] ? (
                    /* Results after voting */
                    <div className="space-y-2.5">
                      <p className="text-slate-500 text-[10px] font-black uppercase tracking-wider mb-3">
                        Resultados parciais
                      </p>
                      {activeScene.choices.map((choice) => {
                        const total = totalVotes(activeScene);
                        const count = choice._count?.votes || 0;
                        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                        const isMyVote = userVotes[activeScene.id] === choice.id;
                        return (
                          <div
                            key={choice.id}
                            className={`rounded-xl border p-3 ${isMyVote ? "border-amber-500/40 bg-amber-500/8" : "border-white/5 bg-white/[0.02]"}`}
                          >
                            <div className="flex justify-between items-center mb-1.5">
                              <span className={`text-sm font-semibold flex items-center gap-1.5 ${isMyVote ? "text-amber-300" : "text-slate-300"}`}>
                                {isMyVote && <Check size={13} />}
                                {choice.text}
                              </span>
                              <span className="text-xs text-slate-500 font-bold">{pct}%</span>
                            </div>
                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-700 ${isMyVote ? "bg-amber-400" : "bg-slate-600"}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <p className="text-slate-700 text-[10px] mt-1">{count} voto{count !== 1 ? "s" : ""}</p>
                          </div>
                        );
                      })}
                      <p className="text-center text-slate-700 text-xs pt-1">
                        Total: {totalVotes(activeScene)} voto{totalVotes(activeScene) !== 1 ? "s" : ""}
                      </p>
                    </div>
                  ) : (
                    /* Voting interface */
                    <div className="space-y-2.5">
                      <p className="text-slate-500 text-[10px] font-black uppercase tracking-wider mb-3">
                        O que acontece a seguir?
                      </p>
                      {activeScene.choices.map((choice) => (
                        <button
                          key={choice.id}
                          disabled={votingId === activeScene.id}
                          onClick={() => handleVote(activeScene.id, choice.id)}
                          className="w-full flex items-center justify-between gap-3 p-4 rounded-xl border border-white/8 bg-white/[0.02] hover:bg-amber-500/10 hover:border-amber-500/30 transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="text-sm font-semibold text-slate-200 group-hover:text-amber-300 transition-colors">
                            {choice.text}
                          </span>
                          {votingId === activeScene.id ? (
                            <Loader2 size={14} className="text-slate-600 animate-spin shrink-0" />
                          ) : (
                            <ChevronRight size={15} className="text-slate-600 group-hover:text-amber-400 shrink-0 transition-colors" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Aviso: sessão sem cena ativa */}
              {selected.status === "active" && !activeScene && !isDirector && (
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex items-center gap-3 text-slate-500">
                  <Pause size={18} className="shrink-0" />
                  <p className="text-sm">Aguardando o diretor ativar a próxima cena...</p>
                </div>
              )}

              {/* ── Scenes list ───────────────────────────────────────────── */}
              <div>
                <h3 className="text-slate-600 text-[10px] font-black uppercase tracking-widest mb-3 px-1">
                  Roteiro · {selected.scenes?.length || 0} cena{(selected.scenes?.length || 0) !== 1 ? "s" : ""}
                </h3>

                {(!selected.scenes || selected.scenes.length === 0) && (
                  <p className="text-slate-700 text-sm text-center py-10">
                    {isDirector ? "Adicione a primeira cena para começar a história." : "Nenhuma cena disponível ainda."}
                  </p>
                )}

                <div className="space-y-3">
                  {selected.scenes?.map((scene) => {
                    const total = totalVotes(scene);
                    const winning = scene.choices.length > 0
                      ? scene.choices.reduce((a, b) => (a._count?.votes || 0) >= (b._count?.votes || 0) ? a : b)
                      : null;

                    return (
                      <div
                        key={scene.id}
                        className={`bg-[#0e0e16] border rounded-xl p-4 transition-all ${
                          scene.isActive ? "border-amber-500/25 shadow-amber-500/5 shadow-sm" : "border-white/5"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="shrink-0 w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-600 text-[10px] font-black">
                            {scene.order}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-white text-sm">{scene.title}</h4>
                              {scene.isActive && (
                                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/25 flex items-center gap-1">
                                  <span className="w-1 h-1 rounded-full bg-green-400 animate-pulse inline-block" />
                                  Ativa
                                </span>
                              )}
                            </div>
                            <p className="text-slate-500 text-xs mt-1 line-clamp-2 leading-relaxed">{scene.content}</p>

                            {/* Choices */}
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {scene.choices.map((c) => (
                                <span
                                  key={c.id}
                                  className="text-[10px] bg-white/5 border border-white/8 px-2 py-0.5 rounded-full text-slate-400"
                                >
                                  {c.text}
                                  {isModerator && ` (${c._count?.votes || 0})`}
                                </span>
                              ))}
                            </div>

                            {/* Results summary for moderators */}
                            {isModerator && total > 0 && winning && (
                              <p className="text-[10px] text-slate-600 mt-1.5">
                                {total} voto{total !== 1 ? "s" : ""} ·{" "}
                                <span className="text-amber-500">"{winning.text}"</span> na frente
                              </p>
                            )}
                          </div>

                          {/* Activate button for moderator/director */}
                          {isModerator && !scene.isActive && selected.status === "active" && (
                            <button
                              onClick={() => handleActivateScene(scene.id)}
                              className="shrink-0 flex items-center gap-1 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors"
                            >
                              <Play size={10} /> Ativar
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── Modal: Criar Sessão ─────────────────────────────────────────────── */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#0e0e16] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <h3 className="font-bold text-white">Nova Sessão de Cinema</h3>
              <button onClick={() => setShowCreateForm(false)} className="text-slate-500 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateSession} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Título</label>
                <input
                  required
                  value={newSession.title}
                  onChange={(e) => setNewSession({ ...newSession, title: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-slate-600"
                  placeholder="Ex: O Labirinto Sem Saída"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Descrição</label>
                <textarea
                  required
                  rows={3}
                  value={newSession.description}
                  onChange={(e) => setNewSession({ ...newSession, description: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-slate-600 resize-none"
                  placeholder="Uma breve sinopse da experiência..."
                />
              </div>
              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-2.5 rounded-xl transition-colors text-sm"
              >
                Criar Sessão
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Adicionar Cena ───────────────────────────────────────────── */}
      {showSceneForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#0e0e16] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <h3 className="font-bold text-white">Adicionar Cena</h3>
              <button onClick={() => setShowSceneForm(false)} className="text-slate-500 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddScene} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Título da Cena</label>
                <input
                  required
                  value={newScene.title}
                  onChange={(e) => setNewScene({ ...newScene, title: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-slate-600"
                  placeholder="Ex: A Encruzilhada"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Narrativa</label>
                <textarea
                  required
                  rows={4}
                  value={newScene.content}
                  onChange={(e) => setNewScene({ ...newScene, content: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-slate-600 resize-none"
                  placeholder="Descreva o que acontece nesta cena e qual decisão precisa ser tomada..."
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                  Opções de Escolha <span className="text-slate-700">(mín. 2, máx. 6)</span>
                </label>
                <div className="space-y-2">
                  {newScene.choices.map((choice, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        value={choice}
                        onChange={(e) => {
                          const updated = [...newScene.choices];
                          updated[i] = e.target.value;
                          setNewScene({ ...newScene, choices: updated });
                        }}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-slate-600"
                        placeholder={`Opção ${i + 1}`}
                      />
                      {newScene.choices.length > 2 && (
                        <button
                          type="button"
                          onClick={() =>
                            setNewScene({
                              ...newScene,
                              choices: newScene.choices.filter((_, idx) => idx !== i),
                            })
                          }
                          className="text-red-500 hover:text-red-400 transition-colors"
                        >
                          <X size={15} />
                        </button>
                      )}
                    </div>
                  ))}
                  {newScene.choices.length < 6 && (
                    <button
                      type="button"
                      onClick={() => setNewScene({ ...newScene, choices: [...newScene.choices, ""] })}
                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                    >
                      <Plus size={12} /> Adicionar opção
                    </button>
                  )}
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-2.5 rounded-xl transition-colors text-sm"
              >
                Salvar Cena
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
