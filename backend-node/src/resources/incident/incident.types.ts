export interface CreateIncidentDto {
    projectId: string;
    title: string;
    description: string;
    category: string;
    severity?: string;
    status?: string;
    responsibleId?: string | null;
}

export interface UpdateIncidentDto {
    title?: string;
    description?: string;
    category?: string;
    severity?: string;
    status?: string;
    responsibleId?: string | null;
}
