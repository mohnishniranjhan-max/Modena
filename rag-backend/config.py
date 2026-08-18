import os
import sys
from pydantic import BaseModel

# Automatically register Windows store user site-packages if present
user_site = os.path.expanduser(r'~\AppData\Local\Packages\PythonSoftwareFoundation.Python.3.13_qbz5n2kfra8p0\LocalCache\local-packages\Python313\site-packages')
if os.path.exists(user_site) and user_site not in sys.path:
    sys.path.insert(0, user_site)

class Settings(BaseModel):
    PROJECT_NAME: str = "Modena RAG Chatbot API"
    VERSION: str = "1.0.0"
    CHROMA_DB_DIR: str = os.path.join(os.path.dirname(__file__), "chroma_data")
    COLLECTION_NAME: str = "modena_products_v1"
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    CONFIDENCE_THRESHOLD: float = 0.35
    TOP_K: int = 4
    MAX_SESSION_HISTORY: int = 10
    ANALYTICS_LOG_FILE: str = os.path.join(os.path.dirname(__file__), "rag_analytics.json")
    
    # Authentication & Security
    JWT_SECRET: str = os.environ.get("JWT_SECRET", "")
    
    # SMTP Email Settings
    SMTP_SERVER: str = os.environ.get("SMTP_SERVER", "smtp.gmail.com")
    SMTP_PORT: int = int(os.environ.get("SMTP_PORT", 587))
    SMTP_USERNAME: str = os.environ.get("SMTP_USERNAME", "")
    SMTP_PASSWORD: str = os.environ.get("SMTP_PASSWORD", "")
    EMAILS_FROM_NAME: str = os.environ.get("EMAILS_FROM_NAME", "Modena Kitchenware")
    EMAILS_FROM_EMAIL: str = os.environ.get("EMAILS_FROM_EMAIL", "")

    # WhatsApp Cloud API (Meta)
    WHATSAPP_PHONE_NUMBER_ID: str = os.environ.get("WHATSAPP_PHONE_NUMBER_ID", "")
    WHATSAPP_ACCESS_TOKEN: str = os.environ.get("WHATSAPP_ACCESS_TOKEN", "")

    # SMS Gateway
    SMS_PROVIDER: str = os.environ.get("SMS_PROVIDER", "twilio")
    TWILIO_ACCOUNT_SID: str = os.environ.get("TWILIO_ACCOUNT_SID", "")
    TWILIO_AUTH_TOKEN: str = os.environ.get("TWILIO_AUTH_TOKEN", "")
    TWILIO_PHONE_NUMBER: str = os.environ.get("TWILIO_PHONE_NUMBER", "")

settings = Settings()

