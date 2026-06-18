import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './modules/auth/auth.routes';
import projectsRoutes from './modules/projects/projects.routes';
import findingsRoutes from './modules/findings/findings.routes';
import { reviewsRouter } from './modules/findings/findings.routes';
import timelineRoutes from './modules/timeline/timeline.routes';
import reportsRoutes, { searchRouter } from './modules/reports/reports.routes';

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', servico: 'API RadarSec' });
});

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/projects/:projectId/findings', findingsRoutes);
app.use('/api/projects/:projectId', reportsRoutes);
app.use('/api/findings', reviewsRouter);
app.use('/api/findings', timelineRoutes);
app.use('/api/search', searchRouter);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Rota não encontrada.' });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

export default app;
