import os
import sys
import json
import datetime
import google.generativeai as genai
import re
import argparse

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

def get_autonomous_topics(count=1):
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
            print(f"⚠️ Warning: Index read failed: {e}")

    prompt = f"""
    You are a Tech Analyst for 'ErrorLog'. Pick {count} high-value, unique programming errors.
    Already covered: {existing_titles}
    
    [Categories to target]
    - Frontend: React, Next.js, Vue, TypeScript, CSS/UI
    - Backend: Node.js, Python, Go, Rust, Java/Spring
    - Infra/DB: Docker, Kubernetes, AWS, SQL, NoSQL
    
    [Rules]
    - Topics must be conceptually different from existing ones.
    - Provide topics from varying categories to maintain variety.
    - Pick specific, real-world issues.
    
    Provide JSON: {{"topics": ["...", ...]}}
    """
    
    print(f"🧠 AI is brainstorming {count} unique topics...")
    try:
        response = model.generate_content(prompt)
        text = response.text.strip()
        if text.startswith("```json"): text = text[7:]
        if text.startswith("```"): text = text[3:]
        if text.endswith("```"): text = text[:-3]
        data = json.loads(text)
        return data['topics'][:count]
    except Exception as e:
        print(f"❌ Brainstorming failed: {e}")
        return ["Common Programming Pitfall"] * count

def generate_and_save(topic):
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-flash-latest')

    prompt = f"""
    Write a clear, expert-level technical article for developers about: "{topic}".
    
    [STRICT JSON FORMAT REQUIRED]
    {{
        "title": "Short, punchy title (Max 60 chars)",
        "slug": "url-friendly-slug",
        "language": "Specific Tech Stack (e.g., 'Go', 'React', 'Docker')",
        "code": "Error type only (e.g., 'DataRace', 'ReadinessProbeFailure'). MAX 30 CHARS.",
        "tags": ["tag1", "tag2"],
        "analysis": "Detailed technical explanation in HTML <p> tags.",
        "root_cause": "The core reason why this fails.",
        "bad_code": "Snippet showing the BUG.",
        "solution_desc": "Explanation of the fix.",
        "good_code": "Snippet showing the FIXED/BEST PRACTICE code.",
        "verification": "How to test the fix."
    }}
    
    IMPORTANT: 
    1. The 'code' field MUST be very short (1-3 words). 
    2. Do NOT include markdown styling like '#' inside JSON values.
    3. Respond ONLY with the JSON.
    """

    print(f"🤖 Generating: '{topic}'...")
    try:
        response = model.generate_content(prompt)
        clean_text = response.text.strip()
        if clean_text.startswith("```json"): clean_text = clean_text[7:]
        if clean_text.startswith("```"): clean_text = clean_text[3:]
        if clean_text.endswith("```"): clean_text = clean_text[:-3]
        
        post_data = json.loads(clean_text)
        
        # Metadata & Resilience
        now = datetime.datetime.now()
        date_str = now.strftime("%Y-%m-%d")
        target_dir = os.path.join(POSTS_DIR, now.strftime("%Y-%m"))
        os.makedirs(target_dir, exist_ok=True)
        
        # Ensure all fields exist
        post_data['title'] = post_data.get('title', topic)
        post_data['slug'] = post_data.get('slug', re.sub(r'[^a-z0-9]', '-', topic.lower()))
        post_data['language'] = post_data.get('language', 'General')
        post_data['code'] = post_data.get('code', 'Error')
        post_data['date'] = date_str
        post_data['id'] = int(now.timestamp()) + hash(post_data['title']) % 1000
        
        filename = f"{post_data['slug']}.js"
        file_path = os.path.join(target_dir, filename)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(f"window.onPostDataLoaded({json.dumps(post_data, indent=4, ensure_ascii=False)});")
            
        return post_data, file_path
    except Exception as e:
        print(f"❌ Failed for {topic}: {e}")
        return None, None

def update_index_file(new_entries):
    try:
        data = []
        if os.path.exists(INDEX_FILE):
             with open(INDEX_FILE, 'r', encoding='utf-8') as f:
                  content = f.read()
                  match = re.search(r'(?:const|var) postsIndex = (\[.*\]);', content, re.DOTALL)
                  if match:
                       data = json.loads(match.group(1))
        
        for entry in reversed(new_entries):
            data.insert(0, entry)
            
        with open(INDEX_FILE, 'w', encoding='utf-8') as f:
            f.write(f"var postsIndex = {json.dumps(data, indent=4, ensure_ascii=False)};")
        print(f"✅ Index updated with {len(new_entries)} items.")
    except Exception as e: print(f"❌ Index failure: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--count", type=int, default=1)
    parser.add_argument("--topic", type=str, default=None)
    args = parser.parse_args()

    topics = [args.topic] if args.topic else get_autonomous_topics(args.count)
    new_entries = []
    
    for t in topics:
        p_data, f_path = generate_and_save(t)
        if p_data:
            new_entries.append({
                "id": p_data['id'],
                "title": p_data['title'],
                "slug": p_data['slug'],
                "language": p_data['language'],
                "code": p_data['code'],
                "date": p_data['date'],
                "path": f_path.replace("\\", "/"),
                "tags": p_data.get('tags', [])
            })
    
    if new_entries:
        update_index_file(new_entries)
