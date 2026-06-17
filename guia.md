# Guia de Execução e Testes — PlotTwister

Este documento detalha os passos para inicializar a infraestrutura do projeto e realizar os testes das rotas de autenticação, controle de acesso e cinema interativo.

## Parte 1: Inicializando a Infraestrutura (Docker)

Toda a aplicação está containerizada. Você só precisa ter o Docker instalado.

**1. Subir todos os serviços em segundo plano:**

```bash
docker-compose up -d
```

**2. Verificar se os containers estão rodando:**

```bash
docker ps
```

_Resultado esperado:_ 3 containers com status `Up`:
- `plottwister-db` — MySQL na porta 3306
- `plottwister-node` — API Node.js na porta 3333
- `plottwister-web` — Frontend Next.js na porta 3001

**3. Aplicar as migrations (apenas na primeira vez):**

```bash
docker-compose exec backend-node npx prisma migrate deploy
```

**4. Abrir o Prisma Studio (opcional — visualização do banco):**

```bash
docker-compose exec backend-node npx prisma studio --port 5555 --hostname 0.0.0.0
```

Acesse `http://localhost:5555` no navegador.

---

## Parte 2: Guia de Testes da API (Postman / Insomnia)

Execute os testes **nesta ordem**. Após o login, copie o `token` retornado e use-o no header `Authorization: Bearer <token>` em todas as requisições protegidas.

---

### Teste 1: Cadastro de Usuário (Signup)

Valida a criação de conta, a política de senha forte e o hash bcrypt.

- **Método:** `POST`
- **URL:** `http://localhost:3333/v1/auth/signup`
- **Headers:** `Content-Type: application/json`
- **Body:**

```json
{
  "email": "espectador@plottwister.com",
  "fullname": "Maria Silva",
  "password": "SenhaForte!2026"
}
```

**✅ Status `201 Created` — Body:**

```json
{
  "id": "uuid-gerado",
  "email": "espectador@plottwister.com",
  "fullname": "Maria Silva",
  "role": "viewer",
  "createdAt": "2026-05-31T..."
}
```

---

### Teste 2: Login

Valida as credenciais e retorna um JWT assinado junto com os dados do usuário.

- **Método:** `POST`
- **URL:** `http://localhost:3333/v1/auth/login`
- **Headers:** `Content-Type: application/json`
- **Body:**

```json
{
  "email": "espectador@plottwister.com",
  "password": "SenhaForte!2026"
}
```

**✅ Status `200 OK` — Body:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-do-usuario",
    "fullname": "Maria Silva",
    "role": "viewer"
  }
}
```

> **Importante:** Copie o `token`. Nas próximas requisições use o header:
> ```
> Authorization: Bearer <token_copiado>
> ```

---

### Teste 3: Acesso sem Token (Rota Protegida)

Valida que rotas privadas rejeitam requisições não autenticadas.

- **Método:** `GET`
- **URL:** `http://localhost:3333/v1/sessions`
- **Headers:** _(nenhum Authorization)_

**❌ Status `401 Unauthorized` — Body:**

```json
{ "msg": "Usuário não autenticado" }
```

---

### Teste 4: Listar Sessões (Espectador autenticado)

- **Método:** `GET`
- **URL:** `http://localhost:3333/v1/sessions`
- **Headers:** `Authorization: Bearer <token_viewer>`

**✅ Status `200 OK` — Body:** array de sessões (vazio se nenhuma foi criada ainda).

---

### Teste 5: Promoção para Diretor (via SQL)

Diretores podem criar e gerenciar sessões. Para promover um usuário:

```bash
docker-compose exec db mysql -uroot -proot plottwister_db -e "UPDATE User SET role = 'director' WHERE email = 'espectador@plottwister.com';"
```

Faça login novamente para obter um novo token com `"role": "director"` no payload.

---

### Teste 6: Criar Sessão (somente Diretor)

- **Método:** `POST`
- **URL:** `http://localhost:3333/v1/sessions`
- **Headers:**
  ```
  Content-Type: application/json
  Authorization: Bearer <token_director>
  ```
- **Body:**

```json
{
  "title": "O Labirinto Sem Saída",
  "description": "Uma história de suspense onde o público decide o destino do protagonista."
}
```

**✅ Status `201 Created`** — retorna o objeto da sessão com `status: "waiting"`.

**❌ Com token de `viewer` — Status `403 Forbidden`:**

```json
{ "msg": "Acesso negado: requer permissão de diretor" }
```

---

### Teste 7: Adicionar Cena a uma Sessão

- **Método:** `POST`
- **URL:** `http://localhost:3333/v1/sessions/<id_da_sessao>/scenes`
- **Headers:** `Authorization: Bearer <token_director>`
- **Body:**

```json
{
  "title": "A Encruzilhada",
  "content": "O protagonista chega a uma bifurcação. À esquerda, uma floresta escura. À direita, luzes ao longe. O que ele faz?",
  "choices": [
    "Entrar na floresta",
    "Seguir em direção às luzes"
  ]
}
```

**✅ Status `201 Created`** — retorna a cena com as opções criadas.

---

### Teste 8: Iniciar Sessão e Ativar Cena

**Iniciar a sessão** (muda status de `waiting` para `active`):

- **Método:** `PATCH`
- **URL:** `http://localhost:3333/v1/sessions/<id_da_sessao>/status`
- **Body:** `{ "status": "active" }`

**Ativar uma cena para votação** (moderador ou diretor):

- **Método:** `PATCH`
- **URL:** `http://localhost:3333/v1/sessions/<id_da_sessao>/scenes/<id_da_cena>/activate`
- **Headers:** `Authorization: Bearer <token_director>`

**✅ Status `200 OK`** — a cena fica com `isActive: true`. As outras cenas da sessão são automaticamente desativadas.

---

### Teste 9: Votar em uma Cena (Espectador)

- **Método:** `POST`
- **URL:** `http://localhost:3333/v1/sessions/vote`
- **Headers:** `Authorization: Bearer <token_viewer>`
- **Body:**

```json
{
  "sceneId": "<id_da_cena_ativa>",
  "choiceId": "<id_da_opcao_escolhida>"
}
```

**✅ Status `201 Created`** — voto registrado.

**❌ Segundo voto na mesma cena — Status `409 Conflict`:**

```json
{ "msg": "Você já votou nesta cena" }
```

**❌ Cena inativa — Status `400 Bad Request`:**

```json
{ "msg": "Cena não está ativa para votação" }
```

---

### Teste 10: Promoção para Moderador

Moderadores podem ativar cenas mas não criar sessões:

```bash
docker-compose exec db mysql -uroot -proot plottwister_db -e "UPDATE User SET role = 'moderator' WHERE email = 'espectador@plottwister.com';"
```

- Tentar criar sessão com token de `moderator` → **`403 Forbidden`**
- Ativar cena com token de `moderator` → **`200 OK`**
