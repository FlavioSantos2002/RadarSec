# Documentação de Execução e Testes - Classificador de Incidentes

Este documento detalha os passos exatos para inicializar a infraestrutura do projeto (Banco de Dados, Inteligência Artificial e Backend Node.js) e realizar os testes de integração das rotas de autenticação e incidentes.

## Parte 1: Inicializando a Infraestrutura (Docker)

Toda a aplicação está containerizada. Não é necessário ter Node.js, Python ou MySQL instalados localmente na sua máquina, apenas o Docker.

> **Pré-requisito:** Cada serviço (`backend-ia`, `backend-node`, `frontend`) deve conter um arquivo `Dockerfile` na sua respectiva pasta. Esses arquivos já estão incluídos no projeto. Sem eles, o `docker-compose up --build` falhará com o erro `failed to read dockerfile`.

**1. Subir os serviços em segundo plano (Detached mode):** Abra o terminal na raiz do projeto e execute:

Bash

```
docker-compose up db backend-ia backend-node -d --build

```

> Use a flag `--build` na **primeira execução** ou sempre que alterar o código-fonte, para garantir que as imagens Docker sejam (re)construídas.

_(Nota: O serviço `frontend` foi omitido neste comando focado na validação exclusiva da API)._

**2. Verificar se os serviços estão rodando:**

Bash

```
docker ps

```

_Resultado Esperado:_ Você deve ver 3 containers na lista com o status `Up` (MySQL na porta 3306, IA na 8000 e Node na 3333).

**3. Sincronizar o Banco de Dados (Rodar Migrations):** Na primeira vez que rodar o projeto, é necessário criar as tabelas no banco de dados vazio:

Bash

```
docker-compose exec backend-node npx prisma migrate dev --name init

```

> **Se já tinha o banco rodando antes da migração JWT:** execute o comando abaixo para adicionar a coluna `role` ao banco existente:
>
> ```
> docker-compose exec backend-node npx prisma migrate dev --name add_role_to_user
> ```

**4. Acessar o Banco de Dados Visualmente (Opcional):** Para abrir o painel do Prisma Studio e ver as tabelas no seu navegador:

Bash

```
docker-compose exec backend-node npx prisma studio --port 5555 --hostname 0.0.0.0

```

_Acesso:_ Abra `http://localhost:5555` no seu navegador.

----------

##  Parte 2: Guia de Testes da API (Postman)

Com a infraestrutura rodando, utilize o Postman ou Insomnia para validar o fluxo de ponta a ponta.

⚠️ **Aviso:** Os testes devem ser feitos **exatamente nesta ordem**. A autenticação utiliza **JWT (JSON Web Token)**. Após o login, copie o token retornado e use-o no header `Authorization: Bearer <token>` em todas as requisições protegidas.

### Teste 1: Cadastro de Usuário (Signup)

Valida a criação do usuário, a restrição de senha forte e o _hash_ de segurança.

-   **Método:** `POST`
    
-   **URL:** `http://localhost:3333/v1/auth/signup`
    
-   **Headers:** `Content-Type: application/json`
    
-   **Body (JSON):**
    

JSON

```
{
  "email": "analista@soc.com",
  "fullname": "Analista de Segurança",
  "password": "SenhaForte!2026"
}

```

**✅ Resultado Esperado:** * **Status:** `201 Created`

-   **Body:** Retorna os dados do usuário recém-criado (sem exibir a senha):
    

JSON

```
{
  "id": "uuid-gerado-pelo-banco",
  "email": "analista@soc.com",
  "fullname": "Analista de Segurança",
  "createdAt": "2026-04-08T...",
  "updatedAt": "2026-04-08T..."
}

```

----------

### Teste 2: Autenticação (Login)

Valida as credenciais e retorna um JWT assinado.

-   **Método:** `POST`
    
-   **URL:** `http://localhost:3333/v1/auth/login`
    
-   **Headers:** `Content-Type: application/json`
    
-   **Body (JSON):**
    

JSON

```
{
  "email": "analista@soc.com",
  "password": "SenhaForte!2026"
}

```

**✅ Resultado Esperado:** * **Status:** `200 OK`

-   **Body:**

JSON

```
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

-   **Importante:** Copie o valor de `token`. Nas próximas requisições, adicione o header:
    ```
    Authorization: Bearer <token_copiado>
    ```
    

----------

### Teste 3: Integração Backend + Inteligência Artificial

Valida a rota protegida, a comunicação do Node.js com o container Python e a persistência final com a categoria detectada.

-   **Método:** `POST`
    
-   **URL:** `http://localhost:3333/v1/incidents`
    
-   **Headers:**
    ```
    Content-Type: application/json
    Authorization: Bearer <token_do_login>
    ```
    
-   **Body (JSON):**
    

JSON

```
{
  "title": "Aviso falso de bloqueio de conta institucional",
  "description": "Mensagens afirmavam que a conta seria bloqueada caso o usuário não acessasse um portal informado no e-mail."
}

```

**✅ Resultado Esperado:** * **Status:** `201 Created`

-   **Body:** Retorna o incidente completo salvo no banco, evidenciando o campo **`category`** preenchido pela IA:
    

JSON

```
{
  "id": "uuid-do-incidente",
  "userId": "uuid-do-analista-logado",
  "title": "Aviso falso de bloqueio de conta institucional",
  "description": "Mensagens afirmavam que a conta seria bloqueada caso o usuário não acessasse um portal informado no e-mail.",
  "category": "phishing",
  "createdAt": "2026-04-08T...",
  "updatedAt": "2026-04-08T..."
}
```

----------

### Teste 4: Promoção de Usuário a Admin (via SQL)

Para conceder o papel de administrador a um usuário, execute diretamente no banco:

Bash

```
docker-compose exec db mysql -uroot -proot incident_db -e "UPDATE User SET role = 'admin' WHERE email = 'analista@soc.com';"

```

Faça login novamente com esse usuário para obter um novo token JWT que já contém `"role": "admin"` no payload.

----------

### Teste 5: Rota Exclusiva de Administrador

Valida o controle de acesso por papel. Retorna todos os incidentes de todos os usuários.

-   **Método:** `GET`
    
-   **URL:** `http://localhost:3333/v1/incidents/admin/all`
    
-   **Headers:**
    ```
    Authorization: Bearer <token_de_admin>
    ```

**✅ Resultado Esperado (token de admin):** Status `200 OK` com lista completa de incidentes incluindo dados do usuário dono.

**❌ Resultado Esperado (token de user comum):** Status `403 Forbidden`:

JSON

```
{
  "msg": "Acesso negado: requer permissão de administrador"
}
```

----------

### Teste 6: Acesso sem Token (Rota Protegida)

Valida que rotas privadas rejeitam requisições sem autenticação.

-   **Método:** `GET`
-   **URL:** `http://localhost:3333/v1/incidents`
-   **Headers:** _(nenhum Authorization)_

**❌ Resultado Esperado:** Status `401 Unauthorized`:

JSON

```
{
  "msg": "Usuário não autenticado"
}
```