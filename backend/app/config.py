from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    DATABASE_URL: str
    JWT_SECRET: str
    ADMIN_SETUP_SECRET: str

    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 465
    SMTP_EMAIL: str = ""
    SMTP_PASSWORD: str = ""

    GOOGLE_CLIENT_ID: str = ""
    RECAPTCHA_SECRET_KEY: str = ""

    # Razorpay Test Mode
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""
    RAZORPAY_CURRENCY: str = "INR"
    # n8n Order Email Webhook
    N8N_ORDER_WEBHOOK_URL: str = ""
    N8N_WEBHOOK_SECRET: str = ""

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        extra="ignore",
    )


settings = Settings()