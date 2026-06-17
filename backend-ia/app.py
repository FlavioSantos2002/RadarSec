from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib

app = FastAPI(title="CyberThreats IA API")

# Carregamento dos modelos
try:
    modelo = joblib.load('modelo_incidentes.pkl')
    vetorizador = joblib.load('vetorizador_tfidf.pkl')
except Exception as e:
    print(f"Erro ao carregar arquivos .pkl: {e}")

class IncidenteRequest(BaseModel):
    title: str
    description: str

@app.post("/classificar")
def classificar_texto(incidente: IncidenteRequest):
    try:
        texto_completo = incidente.title + " " + incidente.description
        
        # 1. Transforma o texto usando o vetorizador carregado
        texto_vetorizado = vetorizador.transform([texto_completo])
        
        # 2. Realiza a predição
        previsao = str(modelo.predict(texto_vetorizado)[0])
        
        # 3. Retorno (Ajustado para o que o Node.js espera)
        return {
            "status": "sucesso",
            "categoria": previsao,  # Mudei de categoria_detectada para categoria
            "texto_analisado": texto_completo
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro no processamento: {str(e)}")

@app.get("/")
def health_check():
    return {"status": "A API da IA está online!"}