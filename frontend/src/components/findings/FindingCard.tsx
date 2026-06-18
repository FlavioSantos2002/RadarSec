import { Link } from 'react-router-dom';
import { FindingSummary } from '../../types';
import StatusBadge from './StatusBadge';
import SeverityBadge from './SeverityBadge';
import { ChevronRight, MoreVertical, Pencil, Trash2 } from 'lucide-react';

interface FindingCardProps {
  finding: FindingSummary;
  projectId: string;
  onEdit?: (finding: FindingSummary) => void;
  onDelete?: (finding: FindingSummary) => void;
}

export default function FindingCard({ finding, projectId, onEdit, onDelete }: FindingCardProps) {
  return (
    <div className="group bg-[#0b1628] border border-cyan-500/10 hover:border-cyan-500/30 rounded-xl p-5 flex items-center justify-between transition-all hover:bg-[#0f1e38]">
      {/* Área de Clique Principal */}
      <Link to={`/projects/${projectId}/findings/${finding.id}`} className="flex-1 min-w-0">
        <h3 className="font-bold text-white text-sm truncate group-hover:text-cyan-400 transition-colors">
          {finding.title}
        </h3>
        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-1.5">
          {finding.author?.name} · {new Date(finding.createdAt).toLocaleDateString('pt-BR')}
        </p>
      </Link>

      {/* Área de Ações */}
      <div className="flex items-center gap-4 ml-4">
        <div className="flex flex-col gap-1 items-end">
          <SeverityBadge severity={finding.severity} />
          <StatusBadge status={finding.status} />
        </div>
        
        {/* Menu de Ações apenas para o dono ou gestor */}
        <div className="flex items-center gap-2 border-l border-cyan-500/10 pl-4">
           <button onClick={() => onEdit?.(finding)} className="text-slate-500 hover:text-cyan-400 transition-colors">
             <Pencil size={16} />
           </button>
           <button onClick={() => onDelete?.(finding)} className="text-slate-500 hover:text-red-400 transition-colors">
             <Trash2 size={16} />
           </button>
        </div>
      </div>
    </div>
  );
}