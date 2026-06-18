export type Role = 'HUNTER' | 'GESTOR';

export type FindingStatus =
  | 'EM_ANALISE'
  | 'VALIDADO'
  | 'DESCARTADO'
  | 'DUPLICADO'
  | 'CORRIGIDO';

export type Severity = 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAIXA' | 'INFORMATIVA';

export type Priority = 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAIXA';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface ProjectMember {
  id: string;
  userId: string;
  user: Pick<User, 'id' | 'name' | 'email' | 'role'>;
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  scope?: string | null;
  createdAt: string;
  updatedAt: string;
  members?: ProjectMember[];
  memberCount?: number;
  findingCount?: number;
  severityCounts?: Record<Severity, number>;
  statusSummary?: Array<{ status: FindingStatus; count: number }>;
  severitySummary?: Array<{ severity: Severity; count: number }>;
  findings?: FindingSummary[];
  _count?: { members: number; findings: number };
}

export interface FindingSummary {
  id: string;
  title: string;
  severity: Severity;
  status: FindingStatus;
  createdAt: string;
  author?: Pick<User, 'id' | 'name'>;
  assignedTo?: Pick<User, 'id' | 'name'> | null;
}

export interface PeerReview {
  id: string;
  findingId: string;
  approved: boolean;
  comment?: string | null;
  createdAt: string;
  reviewer: Pick<User, 'id' | 'name' | 'email'>;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  previousValue?: string | null;
  newValue?: string | null;
  createdAt: string;
  user: Pick<User, 'id' | 'name'>;
}

export interface TimelineMessage {
  id: string;
  content: string;
  createdAt: string;
  author: Pick<User, 'id' | 'name' | 'email'>;
}

export interface FindingAttachment {
  id: string;
  findingId: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
  uploadedBy: Pick<User, 'id' | 'name'>;
}

export interface Finding {
  id: string;
  title: string;
  description: string;
  attackVector: string;
  payload?: string | null;
  poc?: string | null;
  severity: Severity;
  cvssScore?: number | null;
  cvssVector?: string | null;
  status: FindingStatus;
  priority?: Priority | null;
  evidences?: string | null;
  isDuplicate: boolean;
  duplicateOf?: string | null;
  projectId: string;
  authorId: string;
  assignedToId?: string | null;
  createdAt: string;
  updatedAt: string;
  author: Pick<User, 'id' | 'name' | 'email' | 'role'>;
  assignedTo?: Pick<User, 'id' | 'name' | 'email' | 'role'> | null;
  peerReviews?: PeerReview[];
  auditLogs?: AuditLogEntry[];
  attachments?: FindingAttachment[];
}

export interface DashboardStats {
  projectCount: number;
  findingCount: number;
  criticalOpen: number;
  recentProjects: Project[];
}

export interface ProjectReport {
  total: number;
  byStatus: Array<{ status: FindingStatus; count: number }>;
  bySeverity: Array<{ severity: Severity; count: number }>;
}

export interface SearchResult extends FindingSummary {
  project: Pick<Project, 'id' | 'name'>;
  description: string;
}

export const STATUS_LABELS: Record<FindingStatus, string> = {
  EM_ANALISE: 'Em Análise',
  VALIDADO: 'Validado',
  DESCARTADO: 'Descartado',
  DUPLICADO: 'Duplicado',
  CORRIGIDO: 'Corrigido',
};

export const SEVERITY_LABELS: Record<Severity, string> = {
  CRITICA: 'Crítica',
  ALTA: 'Alta',
  MEDIA: 'Média',
  BAIXA: 'Baixa',
  INFORMATIVA: 'Informativa',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  CRITICA: 'Crítica',
  ALTA: 'Alta',
  MEDIA: 'Média',
  BAIXA: 'Baixa',
};

export const ROLE_LABELS: Record<Role, string> = {
  HUNTER: 'Caçador',
  GESTOR: 'Gestor',
};
