import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { randomUUID } from 'crypto';

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), 'uploads');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_FILES = 5;

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/json',
  'application/xml',
  'text/xml',
  'application/zip',
  'application/x-zip-compressed',
]);

export function ensureUploadDir(): void {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 200);
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureUploadDir();
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = sanitizeFilename(path.basename(file.originalname, ext));
    cb(null, `${randomUUID()}-${base}${ext}`);
  },
});

export const uploadAttachments = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE, files: MAX_FILES },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido.'));
    }
  },
});

export { UPLOAD_DIR, MAX_FILES };

const MULTER_ERROR_MESSAGES: Record<string, string> = {
  'File too large': 'Arquivo muito grande. Tamanho máximo: 10 MB.',
  'Too many files': 'Limite de 5 arquivos por envio.',
  'Unexpected field': 'Campo de upload inválido.',
};

export function translateUploadError(message: string | undefined): string {
  if (!message) return 'Erro no upload.';
  return MULTER_ERROR_MESSAGES[message] ?? message;
}
