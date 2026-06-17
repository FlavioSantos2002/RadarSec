# Classificador de Incidentes com IA

Sistema web de registro e classificação automática de incidentes de segurança, com autenticação JWT, controle de acesso por papéis e classificação por Inteligência Artificial.

## 🏗️ Arquitetura

Arquitetura Docker com 4 serviços:

| Serviço | Tecnologia | Porta |
|---|---|---|
| **Banco de Dados** | MySQL 8 | 3306 |
| **Backend IA** | Python / FastAPI | 8000 |
| **Backend Node.js** | Express / TypeScript | 3333 |
| **Frontend** | Next.js | 3001 |

---

## ⚙️ Pré-requisitos

- **Docker** e **Docker Compose** instalados

> Não é necessário ter Node.js, Python ou MySQL instalados localmente.

---

## 🚀 Execução

**1. Subir todos os serviços:**

```bash
docker-compose up --build -d
```

**2. Rodar as migrations (primeira execução):**

```bash
docker-compose exec backend-node npx prisma migrate dev --name init
```

**3. Acessar o sistema:**

- Frontend: http://localhost:3001
- API: http://localhost:3333/v1
- Prisma Studio (banco visual): executar `docker-compose exec backend-node npx prisma studio --port 5555 --hostname 0.0.0.0` e acessar http://localhost:5555

---

## 🔐 Autenticação e Controle de Acesso

### Fluxo de Autenticação JWT

```
[1] Cadastro    →  POST /v1/auth/signup  →  cria usuário com senha hasheada (bcrypt)
[2] Login       →  POST /v1/auth/login   →  valida credenciais, retorna JWT assinado
[3] Requisição  →  Authorization: Bearer <token>  →  middleware valida e identifica usuário
[4] Logout      →  cliente descarta o token do localStorage
```

**Detalhamento:**

1. **Cadastro:** A senha nunca é armazenada em texto puro. O bcrypt aplica hash com salt (`custo 10`) antes de salvar no banco. O campo no banco é `CHAR(60)`, tamanho exato do hash bcrypt.

2. **Login:** O backend compara a senha digitada com o hash usando `bcrypt.compare()`. Se válido, assina um JWT com payload `{ userId, role }` usando o `JWT_SECRET` do servidor com expiração de 24h. O servidor **não guarda estado** — é completamente stateless.

3. **Requisições protegidas:** O token deve ser enviado no header `Authorization: Bearer <token>`. O middleware `isAuth` verifica a assinatura criptográfica do token a cada requisição. Se inválido ou expirado, retorna `401 Unauthorized`.

4. **Autorização por papel:** O middleware `isAdmin` verifica o campo `role` dentro do payload do token. Usuários sem papel `admin` recebem `403 Forbidden`.

### Tipos de Usuário

| Papel | Valor no banco | Atribuição |
|---|---|---|
| **Usuário comum** | `user` | padrão ao cadastrar |
| **Administrador** | `admin` | atribuído manualmente via SQL |

Para promover um usuário a admin:

```bash
docker-compose exec db mysql -uroot -proot incident_db -e "UPDATE User SET role = 'admin' WHERE email = 'seu@email.com';"
```

> Após a promoção, faça login novamente para obter um novo token com `"role": "admin"` no payload.

### Rotas Protegidas

| Rota | Método | Proteção | Descrição |
|---|---|---|---|
| `/v1/auth/signup` | POST | pública | Cadastro de usuário |
| `/v1/auth/login` | POST | pública | Login, retorna JWT |
| `/v1/auth/logout` | POST | pública | Logout (stateless) |
| `/v1/incidents` | GET | `isAuth` | Lista incidentes do usuário logado |
| `/v1/incidents` | POST | `isAuth` | Cria incidente (IA classifica automaticamente) |
| `/v1/incidents/:id` | GET | `isAuth` | Detalha incidente (apenas do próprio usuário) |
| `/v1/incidents/:id` | PUT | `isAuth` | Edita incidente (apenas do próprio usuário) |
| `/v1/incidents/:id` | DELETE | `isAuth` | Remove incidente (apenas do próprio usuário) |
| `/v1/incidents/admin/all` | GET | `isAuth` + `isAdmin` | Lista incidentes de **todos** os usuários |

### Restrições implementadas

- ✅ Senha armazenada com hash bcrypt (nunca em texto puro)
- ✅ Autenticação real via JWT assinado com chave secreta
- ✅ Todas as rotas de incidentes verificam o token **no servidor** antes de processar
- ✅ Permissão de admin verificada **no servidor** via middleware — não apenas no frontend
- ✅ Isolamento de dados: cada usuário acessa apenas seus próprios incidentes
- ✅ Proteção contra timing attack no login (bcrypt executa mesmo para e-mails inexistentes)
- ✅ Rate limiting nas rotas de autenticação (10 tentativas / 15 min)

---

## 🤖 Classificação por IA

Ao criar ou editar um incidente, o backend Node.js envia o título e descrição para o microsserviço Python, que classifica automaticamente em categorias:

- `phishing`
- `malware`
- `brute_force`
- `ddos`
- `vazamento_de_dados`

---

## 📁 Estrutura do Projeto

```
├── backend-node/       # API principal (Express + Prisma + JWT)
│   ├── src/
│   │   ├── middlewares/
│   │   │   ├── isAuth.ts      # Verifica JWT
│   │   │   └── isAdmin.ts     # Verifica papel admin
│   │   └── resources/
│   │       ├── auth/          # Signup, Login, Logout
│   │       └── incident/      # CRUD de incidentes
│   └── prisma/schema.prisma   # Modelos User (com role) e Incident
├── backend-ia/         # Microsserviço de classificação (Python/FastAPI)
├── frontend/           # Interface (Next.js + Tailwind)
└── docker-compose.yml
```
