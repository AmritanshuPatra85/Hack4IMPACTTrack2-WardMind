
class Settings(BaseSettings):
    POSTGRES_URL: str = "sqlite:///./gridmind.db"
    REDIS_URL: str = "rediss://default:gQAAAAAAATMqAAIncDExMzc3OGY0YjAwMDk0NDBmOWZlMTk0YjNiMzhlMzU2ZXAxNzg2MzQ@able-rabbit-78634.upstash.io:6379"
    ML_SERVICE_URL: str = "http://localhost:8001"
    NREL_API_KEY: str = ""
    ENV: str = "development"

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }

settings = Settings()