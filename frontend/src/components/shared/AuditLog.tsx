import { AuditLogEntry, FindingStatus, Priority, STATUS_LABELS, PRIORITY_LABELS } from '../../types';

const ACTION_LABELS: Record<string, string> = {
  STATUS_CHANGED: 'Status alterado',
  PRIORITY_SET: 'Prioridade definida',
  FINDING_REASSIGNED: 'Achado reatribuído',
  PEER_REVIEW_ADDED: 'Revisão entre pares adicionada',
};

const REVIEW_VALUE_LABELS: Record<string, string> = {
  APROVADO: 'Aprovado',
  REPROVADO: 'Reprovado',
};

function formatAuditValue(value: string | null | undefined): string | null {
  if (!value) return null;
  if (value in STATUS_LABELS) return STATUS_LABELS[value as FindingStatus];
  if (value in PRIORITY_LABELS) return PRIORITY_LABELS[value as Priority];
  if (value in REVIEW_VALUE_LABELS) return REVIEW_VALUE_LABELS[value];
  return value;
}

interface AuditLogProps {
  logs: AuditLogEntry[];
}

export default function AuditLogPanel({ logs }: AuditLogProps) {
  if (logs.length === 0) {
    return <p className="text-muted text-sm">Nenhum registro de auditoria.</p>;
  }

  return (
    <div className="space-y-2">
      {logs.map((log) => {
        const previous = formatAuditValue(log.previousValue);
        const current = formatAuditValue(log.newValue);

        return (
          <div key={log.id} className="text-sm border-l-2 border-accent/30 pl-3 py-1">
            <p className="font-medium">{ACTION_LABELS[log.action] ?? log.action}</p>
            <p className="text-muted text-xs">
              {log.user.name} · {new Date(log.createdAt).toLocaleString('pt-BR')}
            </p>
            {(previous || current) && (
              <p className="text-xs mt-1">
                {previous && <span className="text-muted line-through mr-2">{previous}</span>}
                {current && <span className="text-success">{current}</span>}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
