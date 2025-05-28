import os
from dotenv import load_dotenv
from pinecone import Pinecone
from pypdf import PdfReader
from langchain_upstage import UpstageDocumentParseLoader, UpstageEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_pinecone import PineconeVectorStore
from langchain.schema import Document

# 0) .env 로드
load_dotenv()

# 1) 환경 변수 읽기
UPSTAGE_API_KEY  = os.getenv("UPSTAGE_API_KEY")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_ENV     = os.getenv("PINECONE_ENV")  
assert UPSTAGE_API_KEY and PINECONE_API_KEY and PINECONE_ENV, "환경 변수를 설정하세요."

# 2) Pinecone 클라이언트 (인덱스는 이미 존재)
pc = Pinecone(api_key=PINECONE_API_KEY, environment=PINECONE_ENV)
INDEX_NAME = "ngo-medical"

# 3) Upstage 임베딩 & 텍스트 분할기 준비
embeddings = UpstageEmbeddings(api_key=UPSTAGE_API_KEY, model="embedding-query")
splitter   = RecursiveCharacterTextSplitter(chunk_size=2000, chunk_overlap=200)

# 4) VectorStore 초기화
vectorstore = PineconeVectorStore(index_name=INDEX_NAME, embedding=embeddings)

# 5) 이미 처리된 파일 기록
PROCESSED_FILE = "processed_files.txt"
if os.path.exists(PROCESSED_FILE):
    with open(PROCESSED_FILE, "r", encoding="utf-8") as f:
        processed_files = set(line.strip() for line in f)
else:
    processed_files = set()

# ---------- 배치 크기 설정 ----------
BATCH_SIZE = 100  # 업로드 배치당 최대 청크 수

# 6) PDF 파싱 및 인덱싱
PDF_DIR = "downloaded_pdfs"
for root, _, files in os.walk(PDF_DIR):
    for fname in files:
        if not fname.lower().endswith(".pdf"):
            continue
        if fname in processed_files:
            print(f" 이미 처리됨, 스킵: {fname}")
            continue
        pdf_path = os.path.join(root, fname)

        # 6.1) 파일 크기 검증
        if os.path.getsize(pdf_path) < 10 * 1024:
            print(f" 너무 작은 파일, 스킵: {fname}")
            continue

        # 6.2) PDF 유효성 확인
        try:
            reader = PdfReader(pdf_path)
            if len(reader.pages) == 0:
                print(f" 페이지 없음, 스킵: {fname}")
                continue
        except Exception as e:
            print(f" 유효하지 않은 PDF, 스킵: {fname} ({e})")
            continue

        # 6.3) Upstage 파싱
        print(f" 파싱 중: {fname}")
        loader = UpstageDocumentParseLoader(pdf_path, ocr="force")
        try:
            pages = loader.load()
        except Exception as e:
            print(f" 파싱 실패, 스킵: {fname} ({e})")
            continue
        

        # 6.4) 텍스트 청크 생성
        docs = []
        for page_idx, page in enumerate(pages):
            chunks = splitter.split_text(page.page_content)
            for chunk_idx, text in enumerate(chunks):
                docs.append(
                    Document(
                        page_content=text,
                        metadata={
                            "source_file": fname,
                            "page": page_idx,
                            "chunk": chunk_idx
                        }
                    )
                )
        if not docs:
            print(f" 생성된 청크 없음, 스킵: {fname}")
            processed_files.add(fname)
            with open(PROCESSED_FILE, "a", encoding="utf-8") as f:
                f.write(fname + "\n")
            continue

        # 6.5) 배치별 업로드
        print(f" 인덱싱 중 ({len(docs)} 청크): {fname}")
        for i in range(0, len(docs), BATCH_SIZE):
            batch = docs[i : i + BATCH_SIZE]
            vectorstore.add_documents(batch)
            print(f"   배치 업로드: {i}~{i+len(batch)}")

        # 6.6) 처리 완료 기록
        processed_files.add(fname)
        with open(PROCESSED_FILE, "a", encoding="utf-8") as f:
            f.write(fname + "\n")
        print(f" 처리 완료: {fname}")

print(" 모든 파일 처리 및 인덱싱 완료")


