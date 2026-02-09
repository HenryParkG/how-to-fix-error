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
load_dotenv() 
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    print("❌ Error: GEMINI_API_KEY not found in .env or environment.")
    sys.exit(1)

INDEX_FILE = "data/index.js"
POSTS_DIR = "data/posts"

# ==========================================
# 🧠 AI 자율 주제 선정 (Ver 3.6)
# ==========================================
def get_autonomous_topic():
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-flash-latest')
    
    existing_titles = []
    if os.path.exists(INDEX_FILE):
        try:
            with open(INDEX_FILE, 'r', encoding='utf-8') as f:
                content = f.read()
                match = re.search(r'(?:const|var) postsIndex = (\[.*\]);', content, re.DOTALL)
                if match:
                    data = json.loads(match.group(1))
                    existing_titles = [post['title'] for post in data]
        except Exception as e:
            print(f"⚠️ Warning: Could not read index for brainstorming: {e}")

    prompt = f"""
    You are a Tech Trend Bot. Already covered topics: {existing_titles}
    Pick ONE specific, high-value programming error that developers struggle with. 
    Respond in strict JSON format: {{"topic": "..."}}
    """
    
    print("🧠 AI is brainstorming a new topic...")
    try:
        response = model.generate_content(prompt)
        text = response.text.strip()
        if text.startswith("```json"): text = text[7:]
        if text.startswith("```"): text = text[3:]
        if text.endswith("```"): text = text[:-3]
        data = json.loads(text)
        return data['topic']
    except Exception as e:
        print(f"❌ Failed to brainstorm: {e}")
        return "Python UnboundLocalError"

# ==========================================
# 🤖 Gemini 모델 설정
# ==========================================
def generate_high_quality_post(error_topic):
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-flash-latest')

    prompt = f"""
    Act as a Senior Software Engineer. Explain "{error_topic}".
    Provide the output in STRICT JSON format with: title, slug, language, code, tags, analysis, root_cause, bad_code, solution_desc, good_code, verification.
    IMPORTANT: Respond ONLY with the JSON. Do NOT use markdown code blocks.
    """

    print(f"🤖 Senior Engineer AI is analyzing: '{error_topic}'...")
    try:
        response = model.generate_content(prompt)
        clean_text = response.text.strip()
        if clean_text.startswith("```json"): clean_text = clean_text[7:]
        if clean_text.startswith("```"): clean_text = clean_text[3:]
        if clean_text.endswith("```"): clean_text = clean_text[:-3]
        return json.loads(clean_text)
    except Exception as e:
        print(f"❌ Failed to generate content: {e}")
        return None

# ==========================================
# 📝 파일 저장 로직 (Ver 3.6 - JS Wrapper 방식)
# ==========================================
def save_post(post_data):
    try:
        now = datetime.datetime.now()
        year_month = now.strftime("%Y-%m")
        date_str = now.strftime("%Y-%m-%d")
        
        target_dir = os.path.join(POSTS_DIR, year_month)
        os.makedirs(target_dir, exist_ok=True)
        
        # 확장자를 .js로 변경 (CORS 대책)
        filename = f"{post_data['slug']}.js"
        file_path = os.path.join(target_dir, filename)
        
        post_data['date'] = date_str
        post_data['id'] = int(now.timestamp())
        
        # 데이터를 window.onPostDataLoaded 호출로 감싸서 저장 (JSONP 방식)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(f"window.onPostDataLoaded({json.dumps(post_data, indent=4, ensure_ascii=False)});")
            
        print(f"✅ Post content (JS mode) saved to: {file_path}")
        
        index_entry = {
            "id": post_data['id'],
            "title": post_data['title'],
            "slug": post_data['slug'],
            "language": post_data['language'],
            "code": post_data['code'],
            "date": date_str,
            "path": file_path.replace("\\", "/"),
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
                content = f.read()
                match = re.search(r'(?:const|var) postsIndex = (\[.*\]);', content, re.DOTALL)
                if match:
                    try:
                        data = json.loads(match.group(1))
                    except: data = []
        
        data.insert(0, new_entry)
        with open(INDEX_FILE, 'w', encoding='utf-8') as f:
            f.write(f"var postsIndex = {json.dumps(data, indent=4, ensure_ascii=False)};")
        print("✅ Index file updated successfully!")
    except Exception as e:
        print(f"❌ Failed to update index: {e}")

if __name__ == "__main__":
    topic = sys.argv[1] if len(sys.argv) >= 2 else get_autonomous_topic()
    post_data = generate_high_quality_post(topic)
    if post_data and save_post(post_data):
        print("\n🎉 Article Publishing Complete!")
