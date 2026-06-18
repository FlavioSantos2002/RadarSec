import { Severity, SEVERITY_LABELS } from '../../types';

const SEVERITY_STYLES: Record<Severity, string> = {
  CRITICA: 'bg-critical text-white',
  ALTA: 'bg-danger text-white',
  MEDIA: 'bg-warning text-black',
  BAIXA: 'bg-success text-black',
  INFORMATIVA: 'bg-accent text-white',
};

interface SeverityBadgeProps {
  severity: Severity;
}

export default function SeverityBadge({ severity }: SeverityBadgeProps) {
  return (
    <span className={`badge ${SEVERITY_STYLES[severity]}`}>
      {SEVERITY_LABELS[severity]}
    </span>
  );
}
