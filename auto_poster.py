import os
import sys
import json
import datetime
import google.generativeai as genai
import re

from dotenv import load_dotenv

# ==========================================
# ⚙️ 설정 (Configuration)
# ==========================================
load_dotenv() # .env 파일을 로드
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    print("❌ Error: GEMINI_API_KEY not found in .env or environment.")
    sys.exit(1)

INDEX_FILE = "data/index.json"
POSTS_DIR = "data/posts"

# ==========================================
# 🤖 Gemini 모델 설정 (Ver 2.0)
# ==========================================
def generate_high_quality_post(error_topic):
    genai.configure(api_key=GEMINI_API_KEY)
    
    # 모델 선택 (안정적인 flash-latest 모델 사용)
    model = genai.GenerativeModel('gemini-flash-latest')

    # 프롬프트 대폭 강화: 전문가 페르소나, 구조화된 깊이 있는 분석 요청
    prompt = f"""
    Act as a Senior Software Engineer and Tech Blogger with 10+ years of experience.
    Your task is to write a high-quality, in-depth technical article about the following programming error:
    
    Error Topic: "{error_topic}"
    
    The article should be educational, accurate, and practical. 
    It must be structured to help a junior developer fully understand the root cause, not just copy-paste a fix.
    
    Please provide the output in STRICT JSON format with the following keys:
    
    {{
        "title": "A catchy, SEO-friendly title (e.g., 'Stop Using == in JavaScript: Here is Why')",
        "slug": "url-friendly-slug-text",
        "language": "Programming Language (e.g. Python)",
        "code": "Error Code/Type (e.g. TypeError, 500 Internal Server Error)",
        "tags": ["tag1", "tag2", "tag3"],
        "analysis": "A detailed technical analysis of what this error means. Explain the underlying mechanism in plain but technical English. (Use HTML <p> tags if needed for formatting, but mostly plain text).",
        "root_cause": "The specific reason why this happens. Explain memory, syntax, or logic flow.",
        "bad_code": "A realistic code snippet that reproduces this error (Do not explain it here, just the code).",
        "solution_desc": "A comprehensive explanation of the solution. Discuss WHY this is the correct approach. Mention best practices.",
        "good_code": "The corrected, 'Best Practice' version of the code.",
        "verification": "How to verify the fix? Are there edge cases? Tips to avoid this in the future? Any debates specifically about this error in the community?"
    }}
    
    IMPORTANT:
    - Respond ONLY with the JSON. 
    - The content fields (analysis, solution_desc, etc.) should be rich text, but keep them as single strings in JSON. HTML tags like <b>, <i>, <code> are allowed inside these strings for emphasis.
    - Do NOT include markdown code blocks (```json ... ```).
    """

    print(f"🤖 Senior Engineer AI is analyzing: '{error_topic}'...")
    try:
        response = model.generate_content(prompt)
        # 클린업
        clean_text = response.text.strip()
        if clean_text.startswith("```json"):
            clean_text = clean_text[7:]
        if clean_text.startswith("```"):
            clean_text = clean_text[3:]
        if clean_text.endswith("```"):
            clean_text = clean_text[:-3]
            
        return json.loads(clean_text)
    except Exception as e:
        print(f"❌ Failed to generate content: {e}")
        return None

# ==========================================
# 📝 파일 저장 로직 (Ver 2.0 - 분산 저장)
# ==========================================
def save_post(post_data):
    try:
        now = datetime.datetime.now()
        year_month = now.strftime("%Y-%m")
        date_str = now.strftime("%Y-%m-%d")
        
        # 1. 월별 디렉토리 생성 (data/posts/2024-06/)
        target_dir = os.path.join(POSTS_DIR, year_month)
        os.makedirs(target_dir, exist_ok=True)
        
        # 2. 개별 JSON 파일 저장
        filename = f"{post_data['slug']}.json"
        file_path = os.path.join(target_dir, filename)
        
        # 메타데이터 추가
        post_data['date'] = date_str
        post_data['id'] = int(now.timestamp())
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(post_data, f, indent=4, ensure_ascii=False)
            
        print(f"✅ Post content saved to: {file_path}")
        
        # 3. Index.json 업데이트 (경량화된 정보만)
        index_entry = {
            "id": post_data['id'],
            "title": post_data['title'],
            "slug": post_data['slug'],
            "language": post_data['language'],
            "code": post_data['code'],
            "date": date_str,
            "path": file_path.replace("\\", "/"), # 웹 경로 호환용
            "tags": post_data['tags']
        }
        
        update_index_file(index_entry)
        return True
        
    except Exception as e:
        print(f"❌ Failed to save post: {e}")
        return False

def update_index_file(new_entry):
    try:
        data = []
        if os.path.exists(INDEX_FILE):
            with open(INDEX_FILE, 'r', encoding='utf-8') as f:
                try:
                    data = json.load(f)
                except json.JSONDecodeError:
                    data = []
        
        # 최신 글이 위로 오게 (또는 리스트 앞쪽에 추가)
        data.insert(0, new_entry)
        
        with open(INDEX_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
            
        print("✅ Index file updated successfully!")
        
    except Exception as e:
        print(f"❌ Failed to update index: {e}")

# ==========================================
# 🚀 메인 실행
# ==========================================
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python auto_poster.py \"Error topic\"")
        sys.exit(1)

    topic = sys.argv[1]
    
    # 1. Generate High-Quality Content
    post_data = generate_high_quality_post(topic)
    
    if post_data:
        # 2. Save structured data
        if save_post(post_data):
            print("\n🎉 Article Publishing Complete!")
