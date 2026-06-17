# Trabalho Prático — SmartNotes API

**Disciplina:** Desenvolvimento Web e Frameworks Web
**Entrega:** 22/03/2026

---

## 1. Descrição

O **SmartNotes** é uma aplicação de notas pessoais. Cada usuário cria uma conta e gerencia suas próprias notas — nenhum usuário pode ver ou modificar as notas de outro.

O frontend da aplicação já está implementado e disponível no presente repositório. **O trabalho consiste em implementar a API** que o frontend do presente repositório consome.

---

## 2. Stack obrigatória

| Camada | Tecnologia |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Linguagem | TypeScript |
| ORM | Prisma |
| Banco de dados | MySQL |
| Validação | Joi |
| Autenticação | express-session |
| Hash de senha | bcryptjs |

---

## 3. Modelo de dados

A aplicação possui duas entidades. O schema Prisma deve ser criado pelo aluno.

### User

| Campo | Tipo | Restrições |
|---|---|---|
| `id` | `String` | UUID, chave primária |
| `email` | `String` | Único, máx. 100 caracteres |
| `fullname` | `String` | Máx. 100 caracteres |
| `password` | `String` | 60 caracteres (hash bcrypt) |
| `createdAt` | `DateTime` | Gerado automaticamente |
| `updatedAt` | `DateTime` | Atualizado automaticamente |

### Note

| Campo | Tipo | Restrições |
|---|---|---|
| `id` | `String` | UUID, chave primária |
| `userId` | `String` | Chave estrangeira → User |
| `title` | `String` | Máx. 100 caracteres |
| `content` | `String` | Texto longo |
| `createdAt` | `DateTime` | Gerado automaticamente |
| `updatedAt` | `DateTime` | Atualizado automaticamente |

---

## 4. Endpoints

A API deve responder sob o prefixo `/v1`.

### 4.1 Autenticação — `/v1/auth`

#### `POST /v1/auth/signup`

Cria uma nova conta de usuário.

**Request body:**
```json
{
  "email": "usuario@email.com",
  "fullname": "Nome Completo",
  "password": "Senha@123"
}
```

**Respostas:**

| Status | Situação |
|---|---|
| `201` | Usuário criado. Retorna os dados do usuário **sem** o campo `password` |
| `400` | E-mail já cadastrado |
| `422` | Body inválido (validação falhou) |

---

#### `POST /v1/auth/login`

Autentica o usuário e inicia uma sessão.

**Request body:**
```json
{
  "email": "usuario@email.com",
  "password": "Senha@123"
}
```

**Respostas:**

| Status | Situação |
|---|---|
| `200` | Autenticado. Retorna `{ "msg": "Usuário autenticado" }` e seta o cookie de sessão |
| `401` | Credenciais inválidas |
| `422` | Body inválido |

---

#### `POST /v1/auth/logout`

Encerra a sessão do usuário autenticado.

> Rota protegida — requer sessão ativa.

**Respostas:**

| Status | Situação |
|---|---|
| `200` | Sessão destruída. Cookie removido |
| `401` | Usuário não autenticado |

---

### 4.2 Notas — `/v1/notes`

> Todas as rotas abaixo são protegidas — requerem sessão ativa.
> Cada operação deve atuar **apenas sobre as notas do usuário autenticado**.

---

#### `GET /v1/notes`

Retorna todas as notas do usuário autenticado.

**Resposta `200`:**
```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "title": "Minha nota",
    "content": "Conteúdo da nota",
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
]
```

---

#### `POST /v1/notes`

Cria uma nova nota para o usuário autenticado.

**Request body:**
```json
{
  "title": "Minha nota",
  "content": "Conteúdo da nota"
}
```

**Respostas:**

| Status | Situação |
|---|---|
| `201` | Nota criada. Retorna o objeto da nota |
| `401` | Usuário não autenticado |
| `422` | Body inválido |

---

#### `GET /v1/notes/:id`

Retorna uma nota específica pelo ID.

**Respostas:**

| Status | Situação |
|---|---|
| `200` | Retorna o objeto da nota |
| `401` | Usuário não autenticado |
| `404` | Nota não encontrada ou não pertence ao usuário |

---

#### `PUT /v1/notes/:id`

Atualiza uma nota existente.

**Request body:**
```json
{
  "title": "Título atualizado",
  "content": "Conteúdo atualizado"
}
```

**Respostas:**

| Status | Situação |
|---|---|
| `200` | Retorna o objeto da nota atualizado |
| `401` | Usuário não autenticado |
| `404` | Nota não encontrada ou não pertence ao usuário |
| `422` | Body inválido |

---

#### `DELETE /v1/notes/:id`

Remove uma nota.

**Respostas:**

| Status | Situação |
|---|---|
| `204` | Nota removida |
| `401` | Usuário não autenticado |
| `404` | Nota não encontrada ou não pertence ao usuário |

---

## 5. Regras de validação

### Senha (signup)

A senha deve atender **todos** os critérios:

- Mínimo de 8 caracteres, máximo de 128
- Pelo menos uma letra minúscula
- Pelo menos uma letra maiúscula
- Pelo menos um número
- Pelo menos um caractere especial

### Título da nota

- Mínimo 3 caracteres, máximo 100

### Conteúdo da nota

- Mínimo 1 caractere

---

## 6. Requisitos de segurança

Esta é a parte central do trabalho. Os itens abaixo são **obrigatórios** e serão avaliados individualmente.

### 6.1 Gerenciamento de segredos

Nenhum segredo (senha de banco, session secret, etc.) pode aparecer no código-fonte. Todos devem ser lidos de variáveis de ambiente via arquivo `.env`.

### 6.2 Hash de senha

Senhas devem ser armazenadas com hash bcrypt, **nunca em texto puro**.

### 6.3 Sessão segura

O cookie de sessão deve ser configurado com:

- `httpOnly: true`
- `secure: true` em produção
- `sameSite: "lax"`
- `saveUninitialized: false`

### 6.4 Autorização nas notas (IDOR)

Antes de qualquer operação de leitura, atualização ou remoção de uma nota, a API deve verificar se ela pertence ao usuário autenticado. Retornar `404` caso contrário — nunca `403`.

> Retornar `403` confirma que o recurso existe. Retornar `404` não revela essa informação.

### 6.5 Rate limiting

- Limite global: 100 requisições por IP a cada 15 minutos
- Limite nos endpoints de autenticação: 10 requisições por IP a cada 15 minutos

### 6.6 CORS

A API deve aceitar requisições apenas da origem do frontend, com suporte a credenciais. A URL do frontend deve ser configurada via variável de ambiente.

### 6.7 Cabeçalhos de segurança HTTP

Usar o middleware `helmet`. Para uma API pura, no mínimo:

- Remover o cabeçalho `X-Powered-By`
- Ativar `X-Content-Type-Options: nosniff`
- Ativar `Strict-Transport-Security`

### 6.8 Proteção contra timing attack

A função de login deve executar o bcrypt **sempre**, independente de o e-mail existir ou não no banco, de modo que o tempo de resposta seja igual em ambos os casos.

---

## 7. Estrutura de arquivos esperada

```
backend/
├── src/
│   ├── index.ts
│   ├── router/
│   │   ├── index.ts
│   │   └── v1Router.ts
│   ├── middlewares/
│   │   ├── isAuth.ts
│   │   └── validateBody.ts
│   └── resources/
│       ├── auth/
│       │   ├── auth.router.ts
│       │   ├── auth.controller.ts
│       │   ├── auth.service.ts
│       │   ├── auth.schema.ts
│       │   └── auth.types.ts
│       └── note/
│           ├── note.router.ts
│           ├── note.controller.ts
│           ├── note.service.ts
│           ├── note.schema.ts
│           └── note.types.ts
├── prisma/
│   └── schema.prisma
├── .env
└── package.json
```

---

## 8. Como executar o frontend

Com a API rodando, o frontend pode ser inicializado com:

```bash
npm install
npm run dev   # disponível em http://localhost:3001
```

O arquivo `.env` do frontend já está configurado apontando para `http://localhost:3333`. A API deve rodar nessa porta.

---

## 9. Critérios de avaliação

| Item | Peso |
|---|---|
| Endpoints funcionando corretamente | 30% |
| Validações de entrada (Joi) | 10% |
| Autenticação por sessão | 15% |
| Autorização nas notas (IDOR) | 15% |
| Rate limiting | 5% |
| CORS configurado corretamente | 5% |
| Hash de senha e segredos em variáveis de ambiente | 10% |
| Timing attack no login | 5% |
| Cabeçalhos de segurança (helmet) | 5% |
