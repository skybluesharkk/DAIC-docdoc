import os
from typing import Optional

class Config:
    """애플리케이션 설정 클래스"""
    
    # API 키 설정
    UPSTAGE_API_KEY: str = "{UPSTAGE_API_KEY}"
    PINECONE_API_KEY: str = "{PINECONE_API_KEY}"
    
    # Pinecone 설정
    PINECONE_INDEX_NAME: str = "ngo-medical"
    
    # LLM 설정
    UPSTAGE_MODEL: str = "solar-pro"
    EMBEDDING_MODEL: str = "embedding-query"
    
    # 검색 설정
    RETRIEVAL_K: int = 10  # 검색할 문서 개수
    
    # 서버 설정
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # 텍스트 분할 설정
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 100
    
    @classmethod
    def get_upstage_api_key(cls) -> str:
        """환경 변수에서 Upstage API 키를 가져오거나 기본값 사용"""
        return os.getenv("UPSTAGE_API_KEY", cls.UPSTAGE_API_KEY)
    
    @classmethod
    def get_pinecone_api_key(cls) -> str:
        """환경 변수에서 Pinecone API 키를 가져오거나 기본값 사용"""
        return os.getenv("PINECONE_API_KEY", cls.PINECONE_API_KEY)
    
    @classmethod
    def setup_environment(cls):
        """환경 변수 설정"""
        os.environ["UPSTAGE_API_KEY"] = cls.get_upstage_api_key()
        os.environ["PINECONE_API_KEY"] = cls.get_pinecone_api_key()

# 전역 설정 인스턴스
config = Config() 

