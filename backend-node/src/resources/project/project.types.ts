export interface CreateProjectDto {
    name: string;
    description: string;
}

export interface UpdateProjectDto {
    name?: string;
    description?: string;
}
