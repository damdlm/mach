from flask import Flask, render_template, jsonify
import json
import os
from dotenv import load_dotenv

app = Flask(__name__)
load_dotenv()

PROCESSED_DATA_PATH = 'data/processed_clients.json'
CSV_PATH = 'sample_clients.csv' # Usado apenas para fallback

def load_processed_data():
    """Carrega dados processados do arquivo JSON cacheado."""
    if not os.path.exists(PROCESSED_DATA_PATH):
        print(f"⚠️ Aviso: Arquivo cacheado '{PROCESSED_DATA_PATH}' não encontrado. Execute o 'data_processor.py' primeiro.")
        return []
    try:
        # Carrega o cache
        with open(PROCESSED_DATA_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return data
    except Exception as e:
        print(f"❌ Erro ao carregar dados processados: {e}")
        return []

@app.route('/')
def index():
    """Renderiza a página principal do mapa."""
    return render_template('index.html')

@app.route('/api/clients')
def get_clients():
    """Endpoint de ALTA PERFORMANCE: Apenas lê e retorna o JSON pré-calculado."""
    resultado = load_processed_data()
    return jsonify(resultado)

@app.route('/api/cities')
def get_cities():
    """Endpoint para obter cidades únicas (lendo cache para consistência)."""
    try:
        data = load_processed_data()
        cidades_unicas = sorted(list(set(item['cidade'] for item in data)))
        return jsonify(cidades_unicas)
    except Exception as e:
        print(f"Erro ao obter cidades: {e}")
        return jsonify([])

if __name__ == '__main__':
    print(f"🚀 Servidor Flask iniciado. Garanta que '{PROCESSED_DATA_PATH}' esteja atualizado antes de usar.")
    app.run(debug=True)