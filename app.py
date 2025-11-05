from flask import Flask, render_template, jsonify, request, redirect, url_for, session
import json, os
from dotenv import load_dotenv
from flask_session import Session

app = Flask(__name__)
load_dotenv()

# 🔐 Configuração da sessão
app.secret_key = os.getenv("SECRET_KEY", "chave-super-secreta")
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

PROCESSED_DATA_PATH = 'data/processed_clients.json'
USERS_FILE = 'data/users.json'

# ===============================
# FUNÇÕES DE APOIO
# ===============================
def load_processed_data():
    if not os.path.exists(PROCESSED_DATA_PATH):
        print(f"⚠️ Arquivo '{PROCESSED_DATA_PATH}' não encontrado.")
        return []
    try:
        with open(PROCESSED_DATA_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"❌ Erro ao carregar JSON: {e}")
        return []

def load_users():
    """Carrega os usuários do arquivo JSON"""
    if not os.path.exists(USERS_FILE):
        print(f"⚠️ Arquivo '{USERS_FILE}' não encontrado.")
        return []
    try:
        with open(USERS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"❌ Erro ao carregar usuários: {e}")
        return []

def is_authenticated():
    return "user" in session

# ===============================
# ROTAS DE AUTENTICAÇÃO
# ===============================
@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")

        users = load_users()
        for user in users:
            if user.get("username") == username and user.get("password") == password:
                session["user"] = username
                return redirect(url_for("index"))

        return render_template("login.html", error="Usuário ou senha incorretos")

    return render_template("login.html")

@app.route("/logout")
def logout():
    session.pop("user", None)
    return redirect(url_for("login"))

# ===============================
# ROTAS PRINCIPAIS
# ===============================
@app.route("/")
def index():
    if not is_authenticated():
        return redirect(url_for("login"))
    return render_template("index.html")

@app.route("/api/clients")
def get_clients():
    if not is_authenticated():
        return jsonify({"error": "Não autorizado"}), 401
    return jsonify(load_processed_data())

@app.route("/api/cities")
def get_cities():
    if not is_authenticated():
        return jsonify({"error": "Não autorizado"}), 401
    data = load_processed_data()
    cidades = sorted(list(set(item["cidade"] for item in data)))
    return jsonify(cidades)

@app.route("/service-worker.js")
def service_worker():
    return app.send_static_file("service-worker.js")

@app.route("/manifest.json")
def manifest():
    return app.send_static_file("manifest.json")

from flask import send_from_directory

# === PWA SUPPORT ===
@app.route('/service-worker.js')
def service_worker():
    return send_from_directory('static', 'service-worker.js', mimetype='application/javascript')

@app.route('/manifest.json')
def manifest():
    return send_from_directory('static', 'manifest.json', mimetype='application/manifest+json')

# ===============================
if __name__ == "__main__":
    print("🚀 Servidor Flask iniciado com autenticação via JSON.")
    app.run(debug=True)
