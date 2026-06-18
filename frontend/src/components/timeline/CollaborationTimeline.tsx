import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { TimelineMessage } from '../../types';

interface CollaborationTimelineProps {
  findingId: string;
}

export default function CollaborationTimeline({ findingId }: CollaborationTimelineProps) {
  const [messages, setMessages] = useState<TimelineMessage[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchMessages = useCallback(async () => {
    const { data } = await api.get<{ messages: TimelineMessage[] }>(
      `/findings/${findingId}/timeline`
    );
    setMessages(data.messages);
  }, [findingId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    try {
      await api.post(`/findings/${findingId}/timeline`, { content });
      setContent('');
      await fetchMessages();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
        Linha do tempo de colaboração
      </h3>
      
      <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
        {messages.length === 0 && (
          <p className="text-slate-600 text-xs italic">Nenhuma mensagem ainda.</p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className="bg-[#070d1a] border border-cyan-500/5 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-cyan-400">{msg.author.name}</span>
              <span className="text-[10px] text-slate-600 font-black uppercase tracking-wider">
                {new Date(msg.createdAt).toLocaleString('pt-BR')}
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed whitespace-pre-wrap">{msg.content}</p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Escreva uma mensagem..."
          className="flex-1 bg-[#070d1a] border border-cyan-500/20 rounded-lg p-3 text-sm text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none transition-all"
        />
        <button 
          type="submit" 
          disabled={loading || !content.trim()} 
          className="bg-cyan-500 text-[#070d1a] font-black text-xs px-6 py-3 rounded-lg uppercase tracking-widest hover:bg-cyan-400 disabled:opacity-50 transition-all"
        >
          {loading ? '...' : 'Enviar'}
        </button>
      </form>
    </div>
  );
}