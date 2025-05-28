import asyncio
import json
from typing import List, AsyncGenerator, Dict, Optional
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import HTMLResponse
from langchain_pinecone import PineconeVectorStore
from langchain_upstage import UpstageEmbeddings, ChatUpstage
from langchain.chains import RetrievalQA
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain.retrievers import ContextualCompressionRetriever
from langchain.retrievers.document_compressors import CrossEncoderReranker
from langchain_community.cross_encoders import HuggingFaceCrossEncoder
import uvicorn
from config import config
import logging

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, client_id: str = None):
        # 항상 WebSocket을 accept
        await websocket.accept()
            
        if client_id:
            self.active_connections[client_id] = websocket
            logger.info(f"클라이언트 {client_id} 연결됨")
        else:
            # client_id가 없는 경우 websocket 객체를 키로 사용
            self.active_connections[id(websocket)] = websocket

    def update_client_id(self, websocket: WebSocket, old_key: any, new_client_id: str):
        """기존 연결의 클라이언트 ID를 업데이트"""
        if old_key in self.active_connections:
            del self.active_connections[old_key]
        self.active_connections[new_client_id] = websocket
        logger.info(f"클라이언트 ID 업데이트: {old_key} -> {new_client_id}")

    def disconnect(self, websocket: WebSocket, client_id: str = None):
        if client_id and client_id in self.active_connections:
            del self.active_connections[client_id]
            logger.info(f"클라이언트 {client_id} 연결 해제됨")
        else:
            # client_id가 없는 경우 websocket 객체로 찾아서 제거
            ws_id = id(websocket)
            if ws_id in self.active_connections:
                del self.active_connections[ws_id]

    async def send_personal_message(self, message: str, client_id: str):
        if client_id in self.active_connections:
            websocket = self.active_connections[client_id]
            try:
                await websocket.send_text(message)
            except Exception as e:
                logger.error(f"메시지 전송 실패 - 클라이언트 {client_id}: {e}")
                self.disconnect(websocket, client_id)

manager = ConnectionManager()

class LLMService:
    def __init__(self):
        self.client = None
        self.vectorstore = None
        self.embeddings = None
        self.base_retriever = None
        self.reranker_retriever = None
        self.rag_chain = None
        self.advanced_rag_chain = None
        self._initialized = False
        
    async def initialize(self):
        """비동기 초기화"""
        if self._initialized:
            return
            
        try:
            # 환경 변수 설정
            config.setup_environment()
            
            # Upstage 클라이언트 설정
            self.client = ChatUpstage(
                api_key=config.get_upstage_api_key(),
                model=config.UPSTAGE_MODEL,
                streaming=True,
                temperature=0
            )
            
            # 임베딩 및 벡터스토어 설정
            self.embeddings = UpstageEmbeddings(model=config.EMBEDDING_MODEL)
            self.vectorstore = PineconeVectorStore(
                index_name=config.PINECONE_INDEX_NAME,
                embedding=self.embeddings
            )
            
            # 기본 리트리버 설정
            self.base_retriever = self.vectorstore.as_retriever(
                search_type="similarity",
                search_kwargs={"k": config.RETRIEVAL_K}
            )

            # 컴포넌트 초기화
            await self._setup_reranker()
            self._setup_prompts()
            self._setup_chains()
            
            self._initialized = True
            logger.info("LLMService 초기화 완료")
            
        except Exception as e:
            logger.error(f"LLMService 초기화 실패: {e}")
            raise HTTPException(status_code=500, detail=f"서비스 초기화 실패: {str(e)}")
        
    async def close(self):
        """모든 리소스를 정리합니다."""
        try:
            if self.vectorstore:
                # Pinecone 연결 정리 (필요한 경우)
                pass
            if self.client:
                # Upstage 클라이언트 정리 (필요한 경우)
                pass
            logger.info("LLMService 리소스 정리 완료")
        except Exception as e:
            logger.error(f"리소스 정리 중 오류: {e}")
        
    async def _setup_reranker(self):
        """Cross-encoder reranker 설정"""
        try:
            # Cross-encoder 모델 초기화
            cross_encoder = HuggingFaceCrossEncoder(
                model_name="cross-encoder/ms-marco-MiniLM-L-6-v2"
            )
            
            # Reranker 컴프레서 설정
            self.reranker_compressor = CrossEncoderReranker(model=cross_encoder)
            
            # Contextual Compression Retriever로 reranker 적용
            self.reranker_retriever = ContextualCompressionRetriever(
                base_compressor=self.reranker_compressor,
                base_retriever=self.base_retriever
            )
            logger.info("Reranker 설정 완료")

        except Exception as e:
            logger.error(f"Reranker 설정 실패: {e}")
            # Reranker 설정 실패 시 기본 retriever 사용 
            self.reranker_retriever = self.base_retriever  
    
    def _setup_prompts(self):
        """프롬프트 설정"""
        self.rag_prompt = PromptTemplate(
            template="""Role Definition:
You are a specialized AI assistant for medical literature analysis. Provide accurate and comprehensive answers based solely on the provided research paper context, with particular emphasis on experimental data and graphical evidence.
또한 답변은 웬만하면 한국어로 답변해줘

Core Instructions:
1. Fundamental Principles
- Base all responses strictly on the provided paper context
- If information is uncertain or unavailable, clearly state "I don't know" or "This information is not available in the provided context"
- Never speculate or extrapolate beyond the given evidence, as medical accuracy is critical

2. Response Structure Template
Format your responses as follows:

## Direct Answer
[Clear, direct response to the question]

## Experimental Evidence Analysis
### Research Objectives
[Study purpose, hypothesis, and design rationale]

### Key Experimental Findings
[Methodology, results from graphs/data, statistical outcomes]

### Clinical Significance
[Therapeutic implications, statistical significance, clinical applications]

## Important Considerations
[Limitations, contraindications, safety considerations]

IMPORTANT: If asked about information not contained in the provided paper, respond: "This information is not available in the provided research paper. I can only analyze and discuss findings explicitly presented in the given context."

Question: {input}

Context: {context}

Answer:""",
            input_variables=["input", "context"]
        )

        self.classification_prompt = PromptTemplate(
            template="""다음 질문을 분류하세요. 반드시 마지막 줄에 결과만 출력하세요.

분류 기준:
- RAG_NEEDED: 최신 의료 정보나 문서 검색이 필요한 질문 (의료 연구, 치료법, 약물, 질병 정보 등)
- GENERAL_CHAT: 일반적인 대화나 기본 지식 질문 (인사, 간단한 설명, 일반 상식 등)

질문: {question}

분류 결과: [RAG_NEEDED 또는 GENERAL_CHAT]""",
            input_variables=["question"]
        )
        
    def _setup_chains(self):
        """RAG 체인 설정 (Reranker 포함)"""
        def format_docs(docs):
            """문서들을 컨텍스트 문자열로 포맷팅"""
            if not docs:
                return "관련 문서를 찾을 수 없습니다."
            
            top_docs = docs[:5]
            formatted_docs = []
            for i, doc in enumerate(top_docs, 1):
                # reranker score가 있다면 표시
                score_info = ""
                if hasattr(doc, 'metadata') and 'relevance_score' in doc.metadata:
                    score_info = f" (관련도: {doc.metadata['relevance_score']:.3f})"
                
                formatted_docs.append(f"[문서 {i}{score_info}]\n{doc.page_content}")
            
            return "\n\n".join(formatted_docs)

        # 기본 RAG 체인
        self.rag_chain = (
            {
                "context": self.reranker_retriever | format_docs,
                "input": RunnablePassthrough()
            }
            | self.rag_prompt
            | self.client
            | StrOutputParser()
        )
        
        # 고급 체인 구조 (소스 문서 정보도 함께 반환)
        self.advanced_rag_chain = (
            {
                "source": self.reranker_retriever,
                "input": RunnablePassthrough()
            }
            | RunnablePassthrough.assign(
                answer = {
                    "context": lambda x: format_docs(x['source']),
                    "input": lambda x: x["input"]
                }
                | self.rag_prompt
                | self.client
                | StrOutputParser()
            )
        )
            
    async def should_use_rag(self, question: str) -> bool:
        """RAG 사용 여부 판단"""
        try:
            if not self._initialized:
                await self.initialize()
                
            formatted_prompt = self.classification_prompt.format(question=question)
            classification_result = await self.client.ainvoke([HumanMessage(content=formatted_prompt)])
            lines = classification_result.content.strip().split('\n')
            last_line = lines[-1]
            
            return "RAG_NEEDED" in last_line
        
        except Exception as e:
            logger.error(f"분류 실패: {e}")
            return False

    async def get_streaming_answer(self, question: str, websocket: WebSocket, client_id: str = None) -> str:
        """WebSocket을 통한 스트리밍 답변 생성"""
        try:
            if not self._initialized:
                await self.initialize()
                
            # RAG 필요성 판단
            needs_rag = await self.should_use_rag(question)
            
            if needs_rag:
                # RAG를 사용한 답변
                await self._send_websocket_message(websocket, client_id, "의료 문헌을 검색하여 답변드리겠습니다...\n\n", "token")
                
                full_answer = ""
                async for chunk in self.stream_rag_response(question, use_advanced_chain=False):
                    if chunk:
                        await self._send_websocket_message(websocket, client_id, chunk, "token")
                        full_answer += chunk
                
                # 스트리밍 완료 신호
                await self._send_websocket_message(websocket, client_id, full_answer, "stream_end")
                return full_answer
            else:
                # 일반 답변
                await self._send_websocket_message(websocket, client_id, "답변을 생성하겠습니다...\n\n", "token")
                
                full_answer = ""
                async for chunk in self.stream_response(question):
                    if chunk:
                        await self._send_websocket_message(websocket, client_id, chunk, "token")
                        full_answer += chunk
                
                # 스트리밍 완료 신호
                await self._send_websocket_message(websocket, client_id, full_answer, "stream_end")
                return full_answer
                
        except Exception as e:
            error_msg = f"오류가 발생했습니다: {str(e)}"
            logger.error(f"스트리밍 답변 생성 중 오류: {e}")
            await self._send_websocket_message(websocket, client_id, error_msg, "error")
            return error_msg

    async def _send_websocket_message(self, websocket: WebSocket, client_id: str, content: str, msg_type: str):
        """WebSocket 메시지 전송 헬퍼 함수"""
        try:
            response = {
                "type": msg_type,
                "content": content
            }
            
            if client_id:
                response["clientId"] = client_id
                
            await websocket.send_text(json.dumps(response))
        except Exception as e:
            logger.error(f"WebSocket 메시지 전송 오류: {e}")
            # 연결이 끊어진 경우 manager에서 제거
            manager.disconnect(websocket, client_id)

    async def stream_response(self, question: str) -> AsyncGenerator[str, None]:
        """일반적인 질문에 대한 스트리밍 응답"""
        try:
            # 단순히 HumanMessage 하나만 생성
            message = HumanMessage(content=question)
            async for chunk in self.client.astream([message]):
                if chunk.content:
                    yield chunk.content
        except Exception as e:
            logger.error(f"스트리밍 응답 생성 중 오류: {e}")
            yield f"Error: {str(e)}"
    
    async def stream_rag_response(self, question: str, use_advanced_chain: bool = False) -> AsyncGenerator[str, None]:
        """RAG 체인을 사용한 스트리밍 응답"""
        try:
            chain = self.advanced_rag_chain if use_advanced_chain else self.rag_chain
            
            if use_advanced_chain:
                # 고급 체인의 경우 결과에서 answer 부분만 스트리밍
                async for result in chain.astream(question):
                    if isinstance(result, dict) and 'answer' in result:
                        yield result['answer']
                    elif isinstance(result, str):
                        yield result
            else:
                # 기본 체인
                async for chunk in chain.astream(question):
                    if chunk:
                        yield chunk
                        
        except Exception as e:
            logger.error(f"RAG 스트리밍 응답 생성 중 오류: {e}")
            yield f"RAG 처리 중 오류가 발생했습니다: {str(e)}"



# 전역 LLMService 인스턴스
llm_service = LLMService()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 시작 시
    try:
        await llm_service.initialize()
        logger.info("애플리케이션 시작 완료")
    except Exception as e:
        logger.error(f"애플리케이션 시작 실패: {e}")
        raise
    
    yield
    
    # 종료 시
    await llm_service.close()
    logger.info("애플리케이션 종료 완료")

# FastAPI 앱 생성 (수정된 lifespan 사용)
app = FastAPI(
    title="LangChain WebSocket QA Server",
    lifespan=lifespan
)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    client_id = None
    websocket_id = id(websocket)
    connected = False
    
    try:
        # 초기 연결 (client_id 없이)
        await websocket.accept()
        connected = True
        manager.active_connections[websocket_id] = websocket
        logger.info(f"WebSocket 연결됨: {websocket_id}")
        
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            # chat.js에서 보내는 형식에 맞춰 처리
            if message_data.get("type") == "question":
                question = message_data["content"]
                new_client_id = message_data.get("clientId")  # clientId 추출
                
                logger.info(f"질문 받음 - 클라이언트 ID: {new_client_id}, 질문: {question}")
                
                # 클라이언트 ID가 처음 제공되거나 변경된 경우 업데이트
                if new_client_id and new_client_id != client_id:
                    old_key = client_id if client_id else websocket_id
                    manager.update_client_id(websocket, old_key, new_client_id)
                    client_id = new_client_id
                
                # LLMService를 사용한 스트리밍 답변 생성
                await llm_service.get_streaming_answer(question, websocket, client_id)
            else:
                # 기존 방식 호환성 유지
                question = message_data.get("content", "")
                await llm_service.get_streaming_answer(question, websocket)
                
    except WebSocketDisconnect:
        logger.info(f"WebSocket 연결 끊어짐 - 클라이언트: {client_id}")
    except json.JSONDecodeError as e:
        logger.error(f"JSON 파싱 오류: {e}")
        if connected:
            try:
                await websocket.close(code=1003, reason="Invalid JSON")
            except:
                pass
    except Exception as e:
        logger.error(f"WebSocket 오류: {e}")
        if connected:
            try:
                await websocket.close(code=1011, reason="Internal server error")
            except:
                pass
    finally:
        # 연결 정리
        if client_id:
            manager.disconnect(websocket, client_id)
        elif websocket_id in manager.active_connections:
            del manager.active_connections[websocket_id]
            logger.info(f"WebSocket 연결 정리됨: {websocket_id}")

@app.get("/health")
async def health_check():
    """서버 상태 확인 엔드포인트"""
    try:
        # 서비스 초기화 상태 확인
        if not llm_service._initialized:
            return {
                "status": "initializing", 
                "message": "LLMService가 초기화 중입니다."
            }
        
        return {
            "status": "healthy", 
            "message": "LLMService 스트리밍 서버가 정상 작동 중입니다.",
            "active_connections": len(manager.active_connections)
        }
    except Exception as e:
        logger.error(f"Health check 실패: {e}")
        return {
            "status": "unhealthy", 
            "message": f"서버 상태 확인 실패: {str(e)}"
        }

if __name__ == "__main__":
    print("🚀 LangChain LLMService 스트리밍 WebSocket 서버를 시작합니다...")
    print(f"📍 서버 주소: http://{config.HOST}:{config.PORT}")
    print(f"🔌 WebSocket 엔드포인트: ws://{config.HOST}:{config.PORT}/ws")
    print(f"🏥 Health Check: http://{config.HOST}:{config.PORT}/health")
    print("✨ 실시간 스트리밍 답변 생성이 활성화되었습니다!")
    print("🔄 RAG 및 Reranker 기능이 포함되었습니다!")
    uvicorn.run(app, host=config.HOST, port=config.PORT)
