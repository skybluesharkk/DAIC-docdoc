# 똑똑 (DocDoc)

## 📌 개요
### 해외로 파견나가 바쁜 날들을 보내는 의료진에게 도움이 될 AI 서비스, "똑똑" 입니다.

## 🎯 문제 정의 및 기대 효과
[![Video Label](http://img.youtube.com/vi/EAx08q34P0o/0.jpg)](https://youtu.be/EAx08q34P0o)
### 🚨 핵심 문제점
1. 환자 케이스 관리의 체계적 한계
> 열악한 환경에서 수기로 작성되는 환자 기록은 정보 누락의 위험을 안고 있으며, 동시에 다수의 환자를 관리해야 하는 상황에서 각 케이스의 세밀한 추적이 어려워집니다. 특히 교대 근무 체계에서 의료진 간 환자 정보 인수인계가 불완전하게 이뤄질 경우, 치료의 연속성이 끊어져 환자 안전에 위험 요소가 됩니다.
2. 의료 지식 업데이트 및 활용의 현실적 제약
> 파견 의료진들은 현지 의료 활동에 집중하느라 최신 의료 논문 및 가이드라인을 확인하기 어려우며, 인터넷 접속이 제한적인 지역에서는 정보 접근성 자체가 부족합니다. 언어 장벽으로 인한 글로벌 의료 정보 습득의 어려움과 더불어, 급박한 상황에서 필요한 의료 정보를 빠르게 찾아 적용하기 어려운 현실적 제약이 존재합니다.


### 🎯 기대 효과
#### 환자 케이스 관리 시스템을 통한 진료 품질 향상
- 체계적인 환자 기록 관리로 놓치는 케이스 없이 지속적 모니터링이 가능해지며, 표준화된 케이스 기록을 통해 교대 근무 시 효율적인 인수인계를 실현할 수 있습니다. 
#### AI 기반 의료 논문 요약 및 RAG 시스템을 통한 지식 격차 해소
- 바쁜 파견 업무 중에도 핵심 의료 정보를 빠르게 습득할 수 있으며, 최신 연구 결과를 바탕으로 한 더욱 정확한 진단 및 치료 결정이 가능합니다. 논문 요약 제공과 함께, 축적된 의료 논문 데이터베이스에서 RAG 시스템을 통해 즉시 질문에 대한 답변을 받을 수 있습니다. 현재 치료 중인 환자 상황에 맞는 구체적이고 관련성 높은 의료 정보를 맥락 기반으로 검색하여 진료를 보조할 수 있습니다.

  
## ✅ Upstage API 활용

### Document Parser를 활용한 최신 의료 논문 파싱
- Upstage의 Document Parser API를 통해 PDF 형태의 최신 의료 논문을 정확하게 파싱하여 텍스트 데이터로 변환합니다. 복잡한 의료 논문의 구조적 특성(표, 그래프, 참고문헌 등)을 고려하여 핵심 내용을 추출하고, 논문의 제목, 초록, 본문, 결론 등을 체계적으로 분류합니다. 이를 통해 의료진이 필요로 하는 핵심 정보를 효율적으로 처리할 수 있는 기반을 마련합니다.
### Solar LLM을 통한 논문 요약 및 RAG 시스템 구축
- Solar LLM API를 활용하여 파싱된 의료 논문을 의료진이 쉽게 이해할 수 있는 형태로 요약합니다. 각 논문의 핵심 발견사항, 실험 결과 분석, 한계 등 유의성을 중심으로 한 맞춤형 요약을 제공하며, Pinecone 벡터 데이터베이스와 연동하여 RAG(Retrieval-Augmented Generation) 시스템을 구현합니다. 이를 통해 의료진이 실시간으로 질문을 입력하면 관련 논문 데이터베이스에서 가장 적합한 정보를 검색하여 정확하고 근거 기반의 답변을 제공합니다.
### UpstageEmbeddings를 통한 의료 논문 벡터화
- UpstageEmbeddings API를 사용하여 파싱된 의료 논문 텍스트를 고품질의 벡터로 임베딩합니다. 의료 용어와 전문 지식의 특성을 반영한 정밀한 벡터 표현을 생성하여 Pinecone 데이터베이스에 저장하고, 의료진의 질의와 논문 내용 간의 의미적 유사성을 정확하게 계산할 수 있도록 합니다. 이를 통해 RAG 시스템의 검색 정확도를 향상시켜, 의료진이 원하는 정보를 빠르고 정확하게 찾을 수 있도록 지원합니다.

## 🚀 주요 기능
- ✨ 기능 1: 환자 케이스 관리 시스템
  - 직관적인 디지털 환자 케이스 관리 시스템을 통해 수기 작성으로 인한 시간 소모와 정보 누락 위험을 획기적으로 줄입니다. 또한 의료진이 다수의 환자를 효율적으로 모니터링할 수 있도록 지원하며, 이를 통해 의료진이 환자 치료에 더 많은 시간과 집중력을 투입할 수 있는 환경을 조성합니다.
- ✨ 기능 2: 최신 논문 요약 대시보드
  - 열악한 환경과 극도로 바쁜 일정으로 인해 최신 의료 지식 습득이 어려운 해외 파견 의료진을 위해, 핵심만 추린 논문 요약 정보를 제공합니다. AI가 각 논문의 임상적 중요도와 실무 적용 가능성 등등을 분석하여 태그를 부여한 요약본을 제공하여 의료진의 지속적인 학습과 최신 지식 업데이트를 돕습니다.
- ✨ 기능 3: 의료 / 논문 관련 질문 챗봇
  - 축적된 의료 논문 데이터베이스를 기반으로 한 지능형 챗봇을 통해 의료진이 언제든지 전문적인 의료 질문에 대한 즉시 답변을 받을 수 있습니다. 논문 요약을 읽던 중 생긴 궁금증이나 복잡한 의료 용어에 대한 설명, 특정 질환의 최신 치료 가이드라인 등을 자연어로 질문하면 관련 논문과 연구 결과를 바탕으로 근거 있는 답변을 제공합니다.



## 🖼️ 데모
> [배포 링크 https://daic-docdoc.vercel.app/](https://daic-docdoc.vercel.app/)

> 데모 시연 영상

[![Video Label](http://img.youtube.com/vi/Kh-VsqqjvLk/0.jpg)](https://youtu.be/Kh-VsqqjvLk)

<img width="1604" alt="image" src="https://github.com/user-attachments/assets/564abd55-b113-4976-9104-8703bb4bd2f2" />
<img width="1604" alt="image" src="https://github.com/user-attachments/assets/84697365-291c-4afe-a119-c6730e11a248" />
<img width="1624" alt="image" src="https://github.com/user-attachments/assets/1887b1aa-ea3d-4241-979d-61106220757b" />
<img width="1624" alt="image" src="https://github.com/user-attachments/assets/37d8d40d-b308-4943-bbd9-f0d081572943" />
<img width="1624" alt="image" src="https://github.com/user-attachments/assets/c077fdf9-352f-4493-a1fe-db07542ebb13" />
  

## 🔬 기술 구현 요약
### 프론트엔드 및 백엔드 아키텍처
- React 기반의 반응형 프론트엔드를 구축하여 직관적인 사용자 인터페이스를 제공하며, Node.js 백엔드 서버를 통해 안정적인 API 서비스를 운영합니다. 실시간 의료 상담 챗봇 기능을 위해 WebSocket 통신을 구현하여 지연 없는 즉시 응답 시스템을 구축했습니다. 환자 데이터, 케이스 기록, 논문 요약 정보 등 핵심 데이터는 MySQL 서버에 안전하게 저장하였습니다.
### LangChain 기반 RAG 시스템 구현
- LangChain 프레임워크를 활용하여 RAG(Retrieval-Augmented Generation) 시스템을 구현했으며, cross-encoder/ms-marco-MiniLM-L-6-v2 Reranker 모델을 도입하여 검색 정확도를 향상시켰습니다.
  초기 벡터 검색으로 후보 문서들을 추출한 후, Reranker가 질문과의 의미적 관련성을 재평가하여 가장 적합한 문서들을 우선순위로 정렬합니다. 이렇게 정제된 컨텍스트를 Solar LLM에 전달하여 더욱 정확하고 근거 있는 답변을 생성합니다.
  따라서, 의료진이 자연어로 질문을 입력하면 축적된 의료 논문 데이터베이스에서 가장 관련성 높은 정보를 찾아 근거 기반의 답변을 제공할 수 있습니다.
### 논문 수집 및 처리
- 웹 크롤러를 통해 최신 의료 논문을 수집하고, Upstage Document Parser API를 사용하여 PDF 형태의 논문을 정확하게 텍스트로 파싱합니다. 파싱된 논문은 Solar LLM에게 요약을 요청하여 의료진이 쉽게 이해할 수 있는 형태로 가공한 후 MySQL 서버에 저장합니다. 파싱된 텍스트는 동시에 UpstageEmbeddings를 통해 논문 내용을 고품질 벡터로 변환하여 벡터 데이터베이스(Pinecone)에 저장함으로써, 의미적 유사성 기반의 검색이 가능한 시스템을 구축했습니다.


## 🧰 기술 스택 및 시스템 아키텍처
<img width="1090" alt="image" src="https://github.com/user-attachments/assets/4173d36e-1a96-465e-8ff7-f31aeb7ff424" />



## 🔧 설치 및 사용 방법
> 리포지토리 클론 이후 application을 실행할 수 있는 명령어를 작성해주세요.
> 실행할 수 있는 환경이 제한되어 있는 경우, 이곳에 배포 환경을 알려주세요.
> 실제로 배포하고 있다면, 배포 중인 사이트를 알려주셔도 됩니다.
> 아래는 예시입니다.

```bash
git clone https://github.com/skybluesharkk/DAIC-docdoc.git
cd DAIC-docdoc
pip install -r requirements.txt
```

## 📁 프로젝트 구조
> 프로젝트 루트 디렉토리에서 주요 파일 및 폴더의 역할 및 목적을 작성해주세요.
> 필요없다고 생각되는 부분은 생략하셔도 됩니다.
> 아래는 예시입니다.

```bash
DAIC-docdoc/
├── README.md                      # 프로젝트 설명서
├── backend/                       # 노드 백엔드 서버
│   ├── main.js                    # 백엔드 서버 메인 진입점
│   ├── routes/                    # 라우트 처리 
│   └── lib/                       # Config
├── rag-server/                    # RAG용 웹소켓 서버
│   ├── main.py                    # RAG 시스템 클래스 및 웹소켓 서버 로직
│   └── config.py                  # Config
├── crawler/                       # 크롤러 소스코드
│   ├── chunk_pdf_summarizer.py    # 논문 요약 로직
│   ├── crawler.py                 # 논문 크롤링 로직
│   └── indexer.py                 # DP 파싱, 임베딩 로직
└── FE/                            # 프론트
    └── docdoc/
    

```

## 🧑‍🤝‍🧑 팀원 소개

| 이름  | 역할          | GitHub                                       |
| --- | ----------- | -------------------------------------------- |
| 심영찬 | 팀장 / 프론트 개발 | [skybluesharkk](https://github.com/skybluesharkk)     |
| 양준영 | RAG / 백엔드 개발 | [Neibce](https://github.com/Neibce)     |
| 김태균 | RAG | [gyuun](https://github.com/gyuun) |
| 전상현 | 크롤러 개발 | [gu1trh2ro](https://github.com/gu1trh2ro) |

## 💡 참고 자료 및 아이디어 출처 (Optional)

* [Upstage Document Parse](https://www.upstage.ai/products/document-parse)
* [Upstage Building end-to-end RAG system using Solar LLM and MongoDB Atlas](https://www.upstage.ai/blog/en/building-rag-system-using-solar-llm-and-mongodb-atlas)
* [Wikidocs RAG](https://wikidocs.net/233780)
* [Pinecone Docs - LangChain](https://docs.pinecone.io/integrations/langchain)
* [Python Crawler](https://velog.io/@kjyeon1101/Python-%ED%8C%8C%EC%9D%B4%EC%8D%AC-%ED%81%AC%EB%A1%A4%EB%A7%81%EC%9C%BC%EB%A1%9C-%ED%8C%8C%EC%9D%BC%EB%93%A4-%EB%8B%A4%EC%9A%B4%EB%B0%9B%EA%B8%B0)


 

