"""
chunk_pdf_summarizer.py
────────────────────────────────────────────────────────────────
• .env                : UPSTAGE_API_KEY  (PINECONE_API_KEY 선택)
• ./new_pdfs/urls.txt : 원본 URL (저장된 PDF와 1:1 매핑)
• ./new_pdfs/*.pdf    : URL을 safe 이름으로 저장한 PDF
실행 :  python chunk_pdf_summarizer.py
────────────────────────────────────────────────────────────────
"""
import os, json, re, math
from dotenv import load_dotenv

from langchain_upstage import (
    ChatUpstage,
    UpstageEmbeddings,
    UpstageDocumentParseLoader,
)
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_pinecone import PineconeVectorStore

# ──────────────────────────────────────────────────────────────
# 1) 환경 변수
# ──────────────────────────────────────────────────────────────
load_dotenv()
UPSTAGE_API_KEY = os.getenv("UPSTAGE_API_KEY")
assert UPSTAGE_API_KEY, ".env 파일에 UPSTAGE_API_KEY가 없습니다."

# ──────────────────────────────────────────────────────────────
# 2) LLMService (PDF 1개 → JSON dict)
# ──────────────────────────────────────────────────────────────
class LLMService:
    """큰 PDF도 처리 가능한 map-reduce 요약 서비스"""

    # ────── 초기화 ────────────────────────────────────────────
    def __init__(self, pdf_path: str):
        self.pdf_path = pdf_path

        # ① LLM
        self.llm = ChatUpstage(
            api_key=UPSTAGE_API_KEY,
            model="solar-pro",
            max_tokens=1024,            # 출력 길이 제한
        )

        # ② PDF 로딩
        self.loader = UpstageDocumentParseLoader(pdf_path, ocr="force")

        # ③ 분할기 – 토큰≈문자길이 기준
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=1500,   # ≈ 700~800 tokens
            chunk_overlap=200,
            separators=["\n\n", "\n", " "],
        )

        # ④ 벡터스토어
        self.embeddings  = UpstageEmbeddings(model="embedding-query")
        self.vectorstore = PineconeVectorStore(
            index_name="ngo-medical",
            embedding=self.embeddings,
        )

        # ⑤ 부분 요약 프롬프트 (map 단계)
        self.chunk_prompt = PromptTemplate(
            template="아래 내용을 한국어 2~3문장으로 요약하세요:\n\n{chunk}",
            input_variables=["chunk"],
        )

        # ⑥ 최종 JSON 프롬프트 (reduce 단계)
        self.final_prompt = PromptTemplate(
            template="""
다음은 논문의 부분 요약 리스트입니다. 이를 바탕으로
JSON 객체 하나만 출력하세요. summary는 한국어로 출력하고 이외의 문자는 출력 금지.

{{
  "title": "논문 제목",
  "tags": ["태그1", "태그2", "태그3"],
  "summary": "3문장 이내 한국어로 요약"
}}

#Chunks:
{context}
""",
            input_variables=["context"],
        )

        # ⑦ 체인 구성
        self.chunk_chain = (
            {"chunk": lambda x: x}
            | self.chunk_prompt
            | self.llm
            | StrOutputParser()
        )
        self.final_chain = (
            {"context": lambda x: x}
            | self.final_prompt
            | self.llm
            | StrOutputParser()
        )

    # ────── 공개 메서드 ───────────────────────────────────────
    def summarize(self) -> dict:
        """PDF를 읽어 JSON dict 반환 (실패 시 빈 dict)"""
        # 1) 전체 텍스트 → 청크 배열
        text = "\n\n".join(p.page_content for p in self.loader.load())
        chunks = self.splitter.split_text(text)

        # 2) 각 청크 2~3문장 요약 (map)
        partial_summaries = []
        for idx, ch in enumerate(chunks, 1):
            print(f"  • 부분 요약 {idx}/{len(chunks)}")
            summary = self.chunk_chain.invoke(ch).strip()
            partial_summaries.append(summary)

        # 3) 부분 요약 합쳐 최종 JSON 생성 (reduce)
        raw = self.final_chain.invoke("\n\n".join(partial_summaries)).strip()
        raw = re.sub(r"```(?:json)?|```", "", raw).strip()
        try:
            return json.loads(raw)
        except json.JSONDecodeError as e:
            print(" JSON 파싱 실패:", e, "\n원문 일부:", raw[:200], "...")
            return {}

# ──────────────────────────────────────────────────────────────
# 3) 배치 처리
# ──────────────────────────────────────────────────────────────
PDF_DIR   = "./new_pdfs"
URLS_FILE = os.path.join(PDF_DIR, "urls.txt")
assert os.path.exists(URLS_FILE), "urls.txt가 없습니다."

with open(URLS_FILE, encoding="utf-8") as f:
    urls = [u.strip() for u in f if u.strip()]

def safe_name(url: str) -> str:
    n = (url.replace("://", "_").replace("/", "_")
             .replace("?", "_").replace("=", "_"))
    return n if n.lower().endswith(".pdf") else n + ".pdf"

print("=== Chunked PDF Summarizer 시작 ===")
results = []

for url in urls:
    pdf_path = os.path.join(PDF_DIR, safe_name(url))
    if not os.path.exists(pdf_path):
        print(f" PDF 파일 없음: {pdf_path}"); continue

    print(f"▶ {os.path.basename(pdf_path)} 요약 중 ...")
    info = LLMService(pdf_path).summarize()
    if info:
        record = {"url": url, **info}
        print(json.dumps(record, ensure_ascii=False, indent=2))
        print("-" * 60)
        results.append(record)

print(f" 완료! 총 {len(results)}건 처리")
# 필요 시 results를 파일로 저장

"""
llm으로 부터 받은 응답을 api를 통해 Mysql DB에 저장.
"""
import os
import requests
from dotenv import load_dotenv

load_dotenv()
BASE_URL   = os.getenv("BASE_URL")
ACCESS_KEY = os.getenv("ACCESS_KEY")
assert BASE_URL and ACCESS_KEY, "BASE_URL과 ACCESS_KEY를 .env에 설정하세요."

headers = {
    "Content-Type": "application/json",
    "accesskey": ACCESS_KEY,           # Postman spec에 맞춰서
}

# ─── 2) results 리스트를 순회하며 저장 ────────────────────
# 아래 'results' 는 chunk_pdf_summarizer.py 에서 모은 JSON dict 리스트입니다.
for rec in results:
    # API 스펙에 따르면 body는 { "json": {...} } 형태로 래핑
    body = {"json": rec}
    resp = requests.post(
        f"{BASE_URL}/medical-info",
        headers=headers,
        json=body,
        timeout=10,
    )
    try:
        resp.raise_for_status()
        print(f" 저장 성공: {rec['title']}")
    except Exception as e:
        print(f" 저장 실패 ({rec.get('title','unknown')}): {e}, 응답: {resp.text}")
