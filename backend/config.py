import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-2026')
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:///stock_analyzer.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_recycle": 280} if 'sqlite' in os.getenv('DATABASE_URL', '') else {}
    
    # JWT Configuration
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-dev-secret-key-2026')
    JWT_EXPIRY_HOURS = 24
    
    # OTP Configuration
    OTP_EXPIRY_MINUTES = int(os.getenv('OTP_EXPIRY_MINUTES', '5'))
    RESET_TOKEN_EXPIRY_MINUTES = int(os.getenv('RESET_TOKEN_EXPIRY_MINUTES', '30'))

    # NVIDIA Configuration
    NVIDIA_API_KEY = os.getenv('NVIDIA_API_KEY')