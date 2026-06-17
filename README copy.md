link do repositorio: https://github.com/FlavioSantos2002/PlotTwister_Syten


Alunos: Flavio, Amon, Thyago e Moiseis


# PlotTwister — Cinema Interativo

Aplicação web de **cinema interativo em tempo real**: espectadores entram em uma sala, assistem a cenas narradas e votam nas escolhas que moldam o rumo da história. Desenvolvida como webapp de engajamento de audiência para a disciplina de Cibersegurança.

---

## Fluxo de Autenticação

```
POST /v1/auth/signup  →  bcrypt(senha, salt=10) → salva no banco
POST /v1/auth/login   →  valida hash → JWT assinado (24h) → retorna { token, user }
Demais rotas          →  Bearer <token> no header → middleware isAuth valida JWT
```

1. **Cadastro** (`/signup`): senha é processada com `bcrypt` (salt rounds = 10) antes de persistir. Nunca armazenada em texto puro.
2. **Login** (`/login`): compara com `bcrypt.compare`. Proteção contra *timing attack* — o bcrypt roda mesmo quando o e-mail não existe.
3. **JWT**: payload `{ userId, role }`, assinado com `JWT_SECRET`, expira em 24 h.
4. **Proteção de rotas**: middleware `isAuth` verifica e decodifica o token em toda rota privada.

---

## Tipos de Usuário (Roles)

| Role | Label | Permissões |
|---|---|---|
| `viewer` | Espectador | Ver sessões, votar em cenas ativas |
| `moderator` | Moderador | Tudo de viewer + ativar/avançar cenas |
| `director` | Diretor | Tudo de moderador + criar/editar/excluir sessões e cenas |

> O campo `role` é definido no banco (`User.role`, padrão `"viewer"`). Para promover um usuário use diretamente o banco ou um endpoint administrativo futuro.

---

## Rotas Protegidas

### Autenticação (pública)
| Método | Rota | Descrição |
|---|---|---|
| POST | `/v1/auth/signup` | Cadastro com hash de senha |
| POST | `/v1/auth/login` | Login + geração de JWT |

### Sessões (requer `isAuth`)
| Método | Rota | Permissão mínima | Descrição |
|---|---|---|---|
| GET | `/v1/sessions` | `viewer` | Listar todas as sessões |
| GET | `/v1/sessions/:id` | `viewer` | Detalhe: cenas, escolhas, votos |
| POST | `/v1/sessions/vote` | `viewer` | Votar em uma cena ativa |
| PATCH | `/v1/sessions/:sId/scenes/:cId/activate` | `moderator` | Ativar cena para votação |
| POST | `/v1/sessions` | `director` | Criar sessão |
| PATCH | `/v1/sessions/:id/status` | `director` | Iniciar / encerrar sessão |
| POST | `/v1/sessions/:id/scenes` | `director` | Adicionar cena + opções |
| DELETE | `/v1/sessions/:id` | `director` | Excluir sessão |

---

## Executando o Projeto

```bash
docker compose up --build
```

- Frontend: http://localhost:3001
- API: http://localhost:3333/v1

### Aplicar as migrations
```bash
docker exec plottwister-node npx prisma migrate deploy
```

# guia de execução com exemplo em 

[guia de execução e testes](./guia.md)

ou em
https://github.com/FlavioSantos2002/PlotTwister_Syten/blob/main/guia.md
