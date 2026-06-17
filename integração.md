### Inteligência Artificial

**O que ele precisa fazer:** 

**Esquema de Pastas que ele vai trabalhar:**

Plaintext

```
/backend-ia
 ├── Dockerfile
 ├── requirements.txt
 ├── incidentes_cybersecurity_100.csv  <-- Ele precisa colocar a base aqui
 ├── incident_model_training.py        <-- Script que ele vai rodar
 ├── modelo_incidentes.pkl             <-- Arquivo que será gerado
 └── app.py                            

```

**Passo a Passo para o Integrante da IA:**

1.  **Treinar o Modelo:** Ele deve rodar o script `incident_model_training.py` que lê o CSV, aplica o TF-IDF com Naive Bayes e salva o arquivo `modelo_incidentes.pkl`.
    
    -   _Como rodar:_ `docker-compose exec backend-ia python incident_model_training.py`
        
2.  **Remover o Mock:** Ele vai abrir o arquivo `app.py` e voltar o código para carregar o modelo real. O arquivo final dele deve ficar assim:
    

Python

```
from fastapi import FastAPI
from pydantic import BaseModel
import joblib

app = FastAPI()

# Carrega o modelo que acabou de ser treinado
modelo = joblib.load('modelo_incidentes.pkl')

class Incidente(BaseModel):
    titulo: str
    descricao: str

@app.post("/classificar")
def classificar_incidente(incidente: Incidente):
    texto_entrada = incidente.titulo + " " + incidente.descricao
    # Usa a IA de verdade para prever
    categoria_prevista = modelo.predict([texto_entrada])[0]
    return {"categoria": categoria_prevista}

```

**Como ele se integra ao seu Node.js:** Ele não precisa fazer nada especial. O seu Node.js já está programado para disparar um `POST` invisível para `http://backend-ia:8000/classificar`. Desde que a porta 8000 dele esteja funcionando e devolvendo o JSON `{"categoria": "..."}`, a integração está pronta.

----------

###  Missão do Integrante 2: Frontend (Next.js)

**O que ele precisa fazer:** Pegar o código base do "SmartNotes" que estava no repositório, renomear as rotas de "notas" para "incidentes" e adicionar o selo (badge) mostrando a classificação da IA na tela.

**Esquema de Pastas que ele vai trabalhar:**

Plaintext

```
/frontend
 ├── /app
 │   ├── /login 
 │   ├── /signup 
 │   ├── /incidents       <-- Ele deve renomear a pasta /notes para /incidents
 │   │   └── page.tsx     <-- Onde as telas mudam
 │   ├── globals.css
 │   ├── layout.tsx
 │   └── page.tsx         <-- Alterar o redirect para /incidents
 ├── /lib
 │   └── api.ts           <-- Mantém como está (comunicação via Axios)
 ├── .env.local           <-- NEXT_PUBLIC_API_URL=http://localhost:3333/v1

```

**Passo a Passo para o Integrante do Frontend:**

1.  **Mudar as Rotas:** Em `frontend/app/page.tsx`, mudar `redirect("/notes")` para `redirect("/incidents")`. Fazer o mesmo nos arquivos de login e signup após o sucesso da autenticação.
    
2.  **Atualizar a Tipagem e Chamadas API:** No arquivo principal (agora `frontend/app/incidents/page.tsx`), ele precisa trocar o tipo `Nota` para `Incident` e adicionar a `category`. Todas as chamadas para `api.post("/notes")` devem mudar para `api.post("/incidents")`.
    
    TypeScript
    
    ```
    type Incident = {
      id: string;
      title: string;
      description: string; // era content
      category: string;    // NOVO
      createdAt: string;
    };
    
    ```
    
3.  **Atualizar o HTML (UI):** No momento de renderizar a lista (no final do arquivo `page.tsx`), ele deve mapear a variável `incidente.description` e criar um elemento visual para exibir a categoria que o Node.js devolveu:
    
    TypeScript
    
    ```
    <h2 className="font-semibold text-gray-800 truncate">
      {incidente.title}
    </h2>
    {/* Badge da Categoria vinda da IA */}
    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mt-1">
      {incidente.category.toUpperCase()}
    </span>
    <p className="text-gray-600 text-sm mt-1">
      {incidente.description}
    </p>
    
    ```
    

**Como ele se integra ao seu Node.js:** O frontend fará chamadas HTTP direto para a sua porta `3333`. Como você já deixou o CORS configurado para aceitar a origem do frontend e a sessão segura com cookies (`connect.sid`) ativada, a integração ocorrerá de forma fluida. Quando o frontend enviar um título e descrição para a sua API, o usuário verá o card aparecer na tela já com a etiqueta da categoria processada pela IA.