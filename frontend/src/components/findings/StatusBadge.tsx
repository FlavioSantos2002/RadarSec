import { FindingStatus, STATUS_LABELS } from '../../types';

const STATUS_STYLES: Record<FindingStatus, string> = {
  EM_ANALISE: 'bg-[#484F58] text-[#E6EDF3]',
  VALIDADO: 'bg-success text-white',
  DESCARTADO: 'bg-[#6E4040] text-[#F0D0D0]',
  DUPLICADO: 'bg-[#6E40A0] text-white',
  CORRIGIDO: 'bg-[#238636] text-white',
};

interface StatusBadgeProps {
  status: FindingStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`badge ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
