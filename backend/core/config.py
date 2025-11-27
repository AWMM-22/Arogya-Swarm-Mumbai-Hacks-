from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    """Application settings from environment variables"""
    
    # Database
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/arogya_swarm"
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # LLM
    GOOGLE_API_KEY: str
    
    # External APIs
    OPENWEATHERMAP_API_KEY: str
    SAFAR_AIR_API_KEY: Optional[str] = None
    TWILIO_ACCOUNT_SID: Optional[str] = None
    TWILIO_AUTH_TOKEN: Optional[str] = None
    TWILIO_PHONE_NUMBER: Optional[str] = None
    
    # Hospital Configuration
    HOSPITAL_NAME: str = "Apollo Metro Hospital"
    HOSPITAL_CITY: str = "Mumbai"
    HOSPITAL_BEDS: int = 400
    
    # Feature Flags
    DEMO_MODE: bool = True
    ENABLE_VOICE_NARRATION: bool = True
    ENABLE_SMS_NOTIFICATIONS: bool = False
    ENABLE_TWITTER_MOCK: bool = True
    
    # App Settings
    FRONTEND_URL: str = "http://localhost:5173"
    LOG_LEVEL: str = "INFO"
    
    class Config:
        env_file = ".env"

settings = Settings()
