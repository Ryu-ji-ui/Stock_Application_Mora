from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from app import db
from routes.api import api_bp
from routes.auth import auth_bp

load_dotenv()

app = Flask(__name__)
CORS(app, supports_credentials=True)  # Allow frontend to connect with credentials

app.config.from_object('config.Config')
db.init_app(app)

app.register_blueprint(api_bp, url_prefix='/api')
app.register_blueprint(auth_bp, url_prefix='/api/auth')

@app.route('/')
def home():
    return jsonify({'message': 'Stock Analyzer API is running 🚀'})

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)