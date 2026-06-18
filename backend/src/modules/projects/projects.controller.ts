import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import * as projectsService from './projects.service';

export async function list(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Não autenticado.' });
    return;
  }
  const projects = await projectsService.listProjects(req.user.userId);
  res.json({ projects });
}

export async function create(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) return;
  try {
    const project = await projectsService.createProject(req.body, req.user.userId);
    res.status(201).json({ project });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao criar projeto.';
    res.status(400).json({ error: message });
  }
}

export async function getById(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) return;
  const project = await projectsService.getProjectById(req.params.id, req.user.userId);
  if (!project) {
    res.status(404).json({ error: 'Projeto não encontrado ou acesso negado.' });
    return;
  }
  res.json({ project });
}

export async function update(req: AuthRequest, res: Response): Promise<void> {
  try {
    const project = await projectsService.updateProject(req.params.id, req.body);
    res.json({ project });
  } catch {
    res.status(404).json({ error: 'Projeto não encontrado.' });
  }
}

export async function remove(req: AuthRequest, res: Response): Promise<void> {
  try {
    await projectsService.deleteProject(req.params.id);
    res.json({ message: 'Projeto removido com sucesso.' });
  } catch {
    res.status(404).json({ error: 'Projeto não encontrado.' });
  }
}

export async function addMember(req: AuthRequest, res: Response): Promise<void> {
  try {
    const member = await projectsService.addMember(req.params.id, req.body.userId);
    res.status(201).json({ member });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao adicionar membro.';
    res.status(400).json({ error: message });
  }
}

export async function removeMember(req: AuthRequest, res: Response): Promise<void> {
  try {
    await projectsService.removeMember(req.params.id, req.params.userId);
    res.json({ message: 'Membro removido com sucesso.' });
  } catch {
    res.status(404).json({ error: 'Membro não encontrado.' });
  }
}

export async function dashboard(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) return;
  const stats = await projectsService.getDashboardStats(req.user.userId);
  res.json(stats);
}
