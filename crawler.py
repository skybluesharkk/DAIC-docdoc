import os
import time
import requests
from urllib.parse import urlparse, unquote
from bs4 import BeautifulSoup
from tqdm import tqdm

# ─── 설정 ────────────────────────────────────────────────
BASE_URL = "https://scholar.google.co.kr/scholar"
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/114.0.0.0 Safari/537.36"
    )
}
KEYWORDS = [
    "Respiratory Infections", "Diarrheal Diseases",
    "Trauma Care", "Burn Treatment"
]
""""Measles", "Cholera", "Hepatitis A", "Malaria",   
    "Acute Watery Diarrhoea", "Diphtheria"""
OUTPUT_DIR = "downloaded_pdfs"

# ★ 목표 다운로드 성공 개수
MAX_DOWNLOADS = 50

# ★ 키워드당 여유 있게 수집할 링크 수
MAX_PER_KEYWORD = 15     

MAX_PAGES_PER_KEYWORD = 20
DELAY_BETWEEN_PAGES = 10
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB로 상향

os.makedirs(OUTPUT_DIR, exist_ok=True)

def fetch_pdf_links_one_page(query: str, page: int):
    params = {
        "q": f"{query} treatment",
        "hl": "ko",
        "as_ylo": 2025,
        "as_sdt": "0,5",
        "start": page * 10
    }
    resp = requests.get(BASE_URL, params=params, headers=HEADERS)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")
    urls = []
    for span in soup.find_all("span", class_="gs_ctg2"):
        if span.get_text(strip=True) == "[PDF]":
            a = span.find_parent("a", href=True)
            urls.append(a["href"])
    return urls

def collect_pdf_links(keywords):
    """
    키워드별로 MAX_PER_KEYWORD 링크를 모아서
    총 최대 len(keywords) * MAX_PER_KEYWORD 개 링크 반환
    """
    collected = []
    seen = set()

    for kw in keywords:
        print(f"\n▶ '{kw}' 검색 시작 (최대 {MAX_PER_KEYWORD}개)")
        per_count = 0

        for page in range(MAX_PAGES_PER_KEYWORD):
            if per_count >= MAX_PER_KEYWORD:
                break

            print(f"  • 페이지 {page+1}", end="… ")
            try:
                urls = fetch_pdf_links_one_page(kw, page)
            except Exception as e:
                print(f"실패({e})")
                break

            added = 0
            for url in urls:
                if per_count >= MAX_PER_KEYWORD:
                    break
                if url not in seen:
                    seen.add(url)
                    collected.append(url)
                    per_count += 1
                    added += 1

            print(f"키워드 '{kw}' 수집 {per_count}개 (이번 페이지 +{added})")
            if per_count >= MAX_PER_KEYWORD:
                print(f"  • '{kw}' 키워드 수집 완료\n")
                break

            time.sleep(DELAY_BETWEEN_PAGES)

    print(f"\n▶ 총 {len(collected)}개 링크 수집 완료 (링크 풀링 완료)")
    return collected

def download_pdfs(urls, output_dir):
    """
    링크 풀에서 성공적으로 100개 다운로드될 때까지 시도
    skip 403, 대용량 파일, 실패 등은 건너뜀
    """
    session = requests.Session()
    success_count = 0

    for idx, url in enumerate(tqdm(urls, desc="다운로드 진행"), start=1):
        if success_count >= MAX_DOWNLOADS:
            break

        # 1) HEAD 체크
        try:
            head = session.head(url, headers=HEADERS, timeout=5)
            if head.status_code == 403 or head.status_code != 200:
                continue
            size = int(head.headers.get("Content-Length", 0) or 0)
            if size > MAX_FILE_SIZE:
                continue
        except:
            continue

        # 2) 파일명 결정
        path = urlparse(url).path
        fname = unquote(os.path.basename(path).split("?")[0])
        if not fname.lower().endswith(".pdf"):
            fname = f"{idx}_0526_2.pdf"
        dest = os.path.join(output_dir, fname)
        if os.path.exists(dest):
            continue  # 이미 있으면 skip

        # 3) 스트리밍 다운로드
        try:
            with session.get(url, headers=HEADERS, stream=True, timeout=(5,10)) as r:
                r.raise_for_status()
                with open(dest, "wb") as f:
                    for chunk in r.iter_content(chunk_size=8192):
                        if chunk:
                            f.write(chunk)
            success_count += 1
        except Exception:
            continue

    print(f"\n✅ 총 {success_count}개 파일 다운로드 성공")

if __name__ == "__main__":
    # 1) 링크 수집
    all_links = collect_pdf_links(KEYWORDS)

    # 2) 다운로드 (100개 채울 때까지)
    download_pdfs(all_links, OUTPUT_DIR)

    print("\n🎉 모든 작업 완료")
