# RadarSec

**RadarSec** é uma plataforma colaborativa de gestão de vulnerabilidades voltada para equipes de Threat Hunting. Centraliza achados de segurança — payloads, vetores, PoCs, CVSS — em uma única fonte da verdade, substituindo planilhas, PDFs e e-mails dispersos.

## Stack

| Camada    | Tecnologia                          |
|-----------|-------------------------------------|
| Frontend  | React 18, TypeScript, Tailwind CSS  |
| Backend   | Node.js, Express, TypeScript        |
| ORM       | Prisma                              |
| Banco     | PostgreSQL 16                       |
| Auth      | JWT (cookie httpOnly) + bcrypt      |
| Infra     | Docker Compose                      |

## Pré-requisitos

- [Docker](https://www.docker.com/) e Docker Compose
- (Opcional) Node.js 20+ para desenvolvimento local

## Como subir com Docker Compose

```bash
# Na raiz do projeto
cp .env.example .env
docker-compose up --build
```

Serviços disponíveis:

| Serviço  | URL                        |
|----------|----------------------------|
| Frontend | http://localhost:5173      |
| Backend  | http://localhost:3001      |
| Postgres | localhost:5432             |

As migrations do Prisma rodam automaticamente na inicialização do backend.

## Seed de dados (desenvolvimento)

Após subir os containers:

```bash
docker-compose exec backend npx prisma db seed
```

### Credenciais padrão

| Role   | E-mail                 | Senha       |
|--------|------------------------|-------------|
| GESTOR | gestor@radarsec.dev    | Gestor@123  |
| HUNTER | hunter1@radarsec.dev   | Hunter@123  |
| HUNTER | hunter2@radarsec.dev   | Hunter@123  |

## Roles e Permissões

### HUNTER
- Criar e editar **seus próprios** achados
- Submeter peer review (de achados de **outros** Hunters)
- Postar mensagens na timeline de colaboração
- Visualizar projetos dos quais é membro

### GESTOR
- Tudo que o Hunter pode fazer
- Criar, editar e excluir projetos
- Adicionar e remover membros
- Definir prioridades e reatribuir achados
- Busca global (`Ctrl+K`) e exportação CSV/JSON

> A promoção de HUNTER → GESTOR só pode ser feita manualmente no banco de dados.

## Regras de Negócio Críticas

1. **Validação com peer review**: um achado só pode ir para `VALIDADO` se houver pelo menos um peer review aprovado por um Hunter **diferente** do autor.
2. **Auditoria**: toda mudança de status, prioridade ou reatribuição gera registro em `AuditLog`.
3. **Sanitização**: inputs de texto livre são sanitizados no backend contra XSS.
4. **Senhas**: bcrypt com custo 12; `passwordHash` nunca é retornado pela API.

## Endpoints da API

### Autenticação

| Método | Rota                | Descrição                    |
|--------|---------------------|------------------------------|
| POST   | /api/auth/register  | Cadastro de usuário          |
| POST   | /api/auth/login     | Login (retorna JWT + cookie) |
| GET    | /api/auth/me        | Usuário autenticado          |
| POST   | /api/auth/logout    | Logout                       |
| GET    | /api/auth/users     | Listar usuários (GESTOR)     |

### Projetos

| Método | Rota                              | Descrição              |
|--------|-----------------------------------|------------------------|
| GET    | /api/projects/dashboard           | Stats do dashboard     |
| GET    | /api/projects                     | Listar projetos        |
| POST   | /api/projects                     | Criar projeto (GESTOR) |
| GET    | /api/projects/:id                 | Detalhe do projeto     |
| PUT    | /api/projects/:id                 | Atualizar (GESTOR)     |
| DELETE | /api/projects/:id                 | Excluir (GESTOR)       |
| POST   | /api/projects/:id/members         | Adicionar membro       |
| DELETE | /api/projects/:id/members/:userId | Remover membro         |

### Achados

| Método | Rota                                           | Descrição                |
|--------|------------------------------------------------|--------------------------|
| GET    | /api/projects/:projectId/findings              | Listar (filtros)         |
| POST   | /api/projects/:projectId/findings              | Criar (HUNTER)           |
| GET    | /api/projects/:projectId/findings/:id            | Detalhe                  |
| PUT    | /api/projects/:projectId/findings/:id          | Atualizar                |
| PATCH  | /api/projects/:projectId/findings/:id/status   | Mudar status             |
| PATCH  | /api/projects/:projectId/findings/:id/priority | Prioridade (GESTOR)      |
| PATCH  | /api/projects/:projectId/findings/:id/assign   | Reatribuir (GESTOR)      |
| PATCH  | /api/projects/:projectId/findings/:id/duplicate| Marcar duplicado         |

### Peer Review

| Método | Rota                              | Descrição         |
|--------|-----------------------------------|-------------------|
| POST   | /api/findings/:findingId/reviews  | Submeter revisão  |
| GET    | /api/findings/:findingId/reviews  | Listar revisões   |

### Timeline

| Método | Rota                               | Descrição          |
|--------|------------------------------------|--------------------|
| GET    | /api/findings/:findingId/timeline  | Buscar mensagens   |
| POST   | /api/findings/:findingId/timeline  | Enviar mensagem    |

### Relatórios e Busca

| Método | Rota                              | Descrição              |
|--------|-----------------------------------|------------------------|
| GET    | /api/projects/:projectId/reports  | Stats por status/severity |
| GET    | /api/projects/:projectId/export   | Exportar CSV/JSON (GESTOR) |
| GET    | /api/search?q=termo               | Busca global (GESTOR)  |

## Atalhos de Teclado (Frontend)

| Atalho   | Ação                          |
|----------|-------------------------------|
| `N`      | Novo achado (aba Achados)     |
| `Esc`    | Fechar modais                 |
| `Ctrl+K` | Busca global (GESTOR)         |

## Desenvolvimento Local (sem Docker)

```bash
# Backend
cd backend
npm install
cp ../.env.example .env
npx prisma migrate dev
npx prisma db seed
npm run dev

# Frontend (outro terminal)
cd frontend
npm install
npm run dev
```

## Licença

Projeto educacional — RadarSec.
