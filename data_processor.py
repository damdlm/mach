import pandas as pd
import json
import os
import unicodedata
import re
from geopy.geocoders import Nominatim
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()
USE_GEOCODING = os.getenv('USE_GEOCODING', 'false').lower() == 'true'

# Configurações de Arquivo
CLIENTS_CSV = 'data/sample_clients.csv'
CIDADES_JSON = 'cidades.json'
OUTPUT_JSON = 'data/processed_clients.json'
CIDADES_DIR = 'data'


def normalizar_texto(texto):
    """Normaliza strings (nome da cidade ou empresa) para busca/chave."""
    if not texto:
        return ""
    
    texto = str(texto).lower().strip()
    # Remove acentos e caracteres especiais
    texto = unicodedata.normalize('NFKD', texto).encode('ASCII', 'ignore').decode('ASCII')
    
    return texto

def carregar_cidades(filepath):
    """Carrega dados das cidades do JSON e cria um mapa para busca rápida."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            cidades_list = json.load(f)
        
        cidades_map = {
            normalizar_texto(c['nome']): (c['latitude'], c['longitude'])
            for c in cidades_list
        }
        print(f"✅ {len(cidades_list)} cidades carregadas e mapeadas.")
        return cidades_map
    except Exception as e:
        print(f"❌ Erro ao carregar {filepath}: {e}")
        return {}


def get_geocoder():
    """Inicializa o Geocoder (apenas se USE_GEOCODING for True)."""
    if USE_GEOCODING:
        print("🌍 Inicializando geocoder (Geocoder é lento, use com cautela)...")
        return Nominatim(user_agent="client-map-app")
    return None


def processar_dados_clientes():
    """Lê o CSV, processa, agrega pelo nome, adiciona coordenadas e salva em JSON."""
    if not os.path.exists(CLIENTS_CSV):
        print(f"❌ Erro: Arquivo de clientes '{CLIENTS_CSV}' não encontrado.")
        return

    # 1. Carregar Dados
    print("⏳ Carregando CSV...")
    df = pd.read_csv(CLIENTS_CSV, encoding='utf-8')
    cidades_map = carregar_cidades(os.path.join(CIDADES_DIR, CIDADES_JSON) if os.path.exists(os.path.join(CIDADES_DIR, CIDADES_JSON)) else CIDADES_JSON)
    geolocator = get_geocoder()

    empresas = {}
    cidades_nao_encontradas = set()
    
    print("⚙️ Processando e agregando dados por NOME...")
    
    for i, row in df.iterrows():
        try:
            nome_original = str(row['Nome']).strip()
            
            # CHAVE DE AGREGAÇÃO POR NOME
            chave_nome = normalizar_texto(nome_original)
            
            if not chave_nome:
                continue

            cnpj_original = str(row['CNPJ']).strip()
            cidade_original = str(row['Cidade']).strip()
            
            # Normalização da cidade para busca no mapa
            cidade_normalizada = normalizar_texto(cidade_original)
            cidade_normalizada = re.sub(r'\s*-\s*[a-z]{2}$', '', cidade_normalizada)
            cidade_normalizada = re.sub(r'^(departamento|munic[ií]pio|cidade)\s+de\s+', '', cidade_normalizada)
            
            # Extrair nome do equipamento
            equipamento_full = str(row['Equipamento']).strip()
            match = re.search(r'\]\s*-\s*([^\n]+)', equipamento_full)
            equipamento = match.group(1).strip() if match and len(match.groups()) >= 1 else equipamento_full

            # Inicializar a empresa se for o primeiro registro desse NOME
            if chave_nome not in empresas:
                lat, lng = None, None
                
                # Buscar coordenadas
                if cidade_normalizada in cidades_map:
                    lat, lng = cidades_map[cidade_normalizada]
                elif USE_GEOCODING and geolocator:
                    location = geolocator.geocode(cidade_original + ", Brasil", timeout=5)
                    if location:
                        lat, lng = location.latitude, location.longitude
                else:
                    cidades_nao_encontradas.add(cidade_original)
                
                # Adiciona o novo cliente
                empresas[chave_nome] = {
                    'nome': nome_original,
                    'cnpj': cnpj_original, 
                    'cidade': cidade_original,
                    'contato': str(row['Contato']).strip(),
                    'telefone': str(row['Telefone']).strip(),
                    'lat': lat,
                    'lng': lng,
                    'equipamentos': set()
                }
            
            # Adicionar o equipamento ao conjunto (set) da empresa
            if equipamento and equipamento.lower() != 'não informado':
                empresas[chave_nome]['equipamentos'].add(equipamento)
                
        except Exception as e:
            continue

    # Finalizar o processamento e converter sets para listas
    resultado = []
    cidades_encontradas_count = 0
    
    for chave, empresa_data in empresas.items():
        empresa_data['equipamentos'] = sorted(list(empresa_data['equipamentos']))
        
        if empresa_data['lat'] is not None and empresa_data['lng'] is not None:
            cidades_encontradas_count += 1
            
        resultado.append(empresa_data)
    
    # Imprimir Estatísticas e Salvar
    print(f"\n🎉 RESUMO DO PROCESSAMENTO:")
    print(f"   Total de entradas no CSV: {len(df)}")
    print(f"   Total de empresas (Nomes ÚNICOS): {len(resultado)}")
    print(f"   Empresas com coordenadas: {cidades_encontradas_count}")

    if not os.path.exists(CIDADES_DIR):
        os.makedirs(CIDADES_DIR)
        
    print(f"💾 Salvando dados processados em '{OUTPUT_JSON}'...")
    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(resultado, f, ensure_ascii=False, indent=2)
    print("✅ Dados processados e salvos com sucesso!")


if __name__ == '__main__':
    if not os.path.exists(os.path.join(CIDADES_DIR, CIDADES_JSON)) and os.path.exists(CIDADES_JSON):
         if not os.path.exists(CIDADES_DIR):
             os.makedirs(CIDADES_DIR)
         os.rename(CIDADES_JSON, os.path.join(CIDADES_DIR, CIDADES_JSON))
         
    processar_dados_clientes()