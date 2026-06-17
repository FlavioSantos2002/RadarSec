# RadarSec - Guia Completo de Instalação e Uso

Plataforma de gerenciamento de projetos e incidentes para times de cibersegurança.

---

## 📌 1. Visão Geral e Arquitetura

O projeto é composto por três partes principais:
1. **Banco de Dados**: MySQL 8.
2. **Backend (API)**: Node.js com Express, TypeScript e Prisma ORM. Responsável pela lógica de negócios, autenticação JWT e integração com o banco de dados.
3. **Frontend (Interface)**: Next.js com React e Tailwind CSS. Interface do usuário.

---

## 🛠️ 2. Pré-requisitos

A aplicação foi projetada para rodar de forma isolada em containers, não sendo necessário instalar Node.js, Python ou MySQL na sua máquina.

Para rodar a aplicação, você precisará ter instalado apenas:
- [Git](https://git-scm.com/downloads) (Para baixar o projeto)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Para rodar os serviços)

Certifique-se de que as portas **3001** (Frontend), **3333** (Backend API), **3306** (MySQL) e **5555** (Prisma Studio) estejam livres no seu sistema.

---

## 📥 3. Como Baixar o Projeto

Abra o terminal e execute o comando abaixo para clonar o repositório:

```bash
git clone <URL_DO_REPOSITORIO>
cd RadarSec
```
*(Substitua `<URL_DO_REPOSITORIO>` pela URL real do repositório Git, caso aplicável. Se você já tem os arquivos, apenas acesse a pasta `RadarSec`).*

---

## 🐳 4. Como Rodar a Aplicação

Este método sobe todos os serviços (Banco, Backend e Frontend) de forma automática via Docker.

**Passo a passo:**
1. Abra o terminal na raiz do projeto (onde está o arquivo `docker-compose.yml`).
2. Construa as imagens e suba os containers em segundo plano:
   ```bash
   docker compose up --build -d
   ```
3. Aguarde alguns segundos para os serviços inicializarem. O backend rodará as migrações automaticamente ao iniciar.
4. Para visualizar os logs e acompanhar se a API e o Frontend subiram corretamente, use:
   ```bash
   docker compose logs -f
   ```

**Para parar a aplicação:**
```bash
docker compose down
```

**Para resetar o banco de dados (Aviso: apaga todos os dados e uploads):**
```bash
docker compose down -v
```

---

## 🗺️ 5. Estrutura do Projeto (Onde está cada coisa)

- `docker-compose.yml`: Arquivo responsável por orquestrar os containers (Banco, Node e Next.js).
- `backend-node/`: Diretório contendo todo o código da API REST.
  - `src/index.ts`: Ponto de entrada principal da API.
  - `src/resources/`: Controladores (Controllers), serviços (Services) e rotas organizados por domínio (`auth`, `incident`, `project`, `evidence`).
  - `src/middlewares/`: Regras de proteção de rota (ex: `isAuth` para JWT, `isAdmin` para permissões).
  - `prisma/schema.prisma`: Definição das tabelas e do modelo de dados para o banco.
  - `uploads/`: Diretório onde os arquivos de evidências são armazenados (mapeado para volume no Docker).
- `frontend/`: Diretório contendo a interface construída com React e Next.js.
  - `app/`: Contém as páginas visuais da aplicação (`login`, `signup`, `projects`, `incidents`, etc.).
  - `lib/api.ts`: Configuração do cliente Axios para conectar com as rotas do backend.

---

## 🔗 6. Acessos Úteis

| Serviço | URL |
|---|---|
| **Frontend** | [http://localhost:3001](http://localhost:3001) |
| **API REST** | `http://localhost:3333/v1` |
| **Banco de Dados** | Porta `3306` |

---

## 🔧 7. Comandos e Operações Úteis

### Ver a Interface Visual do Banco de Dados (Prisma Studio)
Com os containers rodando, abra um terminal e execute:
```bash
docker exec -it radarsec-node npx prisma studio --port 5555 --hostname 0.0.0.0
```
*(Em seguida, acesse no navegador: `http://localhost:5555`)*

### Como Promover um Usuário a Administrador
O sistema permite o cargo de `admin` para funcionalidades elevadas (como visualizar todos os incidentes de todos os usuários do sistema). Execute:
```bash
docker compose exec db mysql -uroot -proot radarsec_db -e "UPDATE User SET role = 'admin' WHERE email = 'seu@email.com';"
```
*(Troque `seu@email.com` pelo e-mail cadastrado. Após rodar o comando, você precisa fazer o logout e login novamente para atualizar o token JWT).*

---

## 📝 8. Fluxo de Uso Básico

1. **Cadastro**: Acesse o frontend (`/signup`) e crie uma conta.
2. **Login**: Acesse (`/login`) para entrar no sistema.
3. **Projetos**: Na listagem de projetos, clique em "Novo Projeto" e preencha os dados (você ficará marcado como responsável).
4. **Incidentes**: Dentro do seu projeto recém-criado, reporte novos incidentes de segurança (informando severidade, status, etc).
5. **Evidências**: Ao acessar um incidente específico, vá até a aba "Evidências" para fazer o upload e gerenciar arquivos comprobatórios (prints, relatórios, etc).
