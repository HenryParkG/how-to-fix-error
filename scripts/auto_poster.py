import os
import sys
import json
import datetime
import google.generativeai as genai
import re
import argparse
import urllib.request
import time

from dotenv import load_dotenv

# ==========================================
# ⚙️ 설정 (Configuration)
# ==========================================
load_dotenv() 
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    print("❌ Error: GEMINI_API_KEY not found in .env or environment.")
    sys.exit(1)

import random

INDEX_FILE = "data/index.js"
POSTS_DIR = "data/posts"

def get_github_trending():
    """Fetches trending repositories from GitHub Search API (last 7 days, most stars)"""
    try:
        date_query = (datetime.datetime.now() - datetime.timedelta(days=7)).strftime("%Y-%m-%d")
        url = f"https://api.github.com/search/repositories?q=created:>{date_query}&sort=stars&order=desc"
        
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            
        trends = []
        for repo in data.get('items', [])[:3]:
            trends.append(f"Analyze the trending GitHub repository '{repo['full_name']}' ({repo['description']}). Explain why it's popular and how to use it.")
            
        print(f"🔥 Found {len(trends)} trending repos on GitHub!")
        return trends
    except Exception as e:
        print(f"⚠️ GitHub API Error: {e}")
        return []

# Priority list of models to try (Latest -> Older)
# Priority list of models to try (Latest -> Older)
# Priority list of models to try (Latest -> Older)
MODELS_TO_TRY = [
    "gemini-3-pro-preview",
    "gemini-3-flash-preview",
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-2.0-flash-exp",
    "gemini-1.5-flash",
    "gemini-1.5-pro"
]

def generate_smart(prompt):
    """Tries generation with multiple models before giving up."""
    genai.configure(api_key=GEMINI_API_KEY)
    
    last_error = None
    
    for model_name in MODELS_TO_TRY:
        try:
            print(f"🤖 Trying model: {model_name}...")
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(prompt)
            return response
        except Exception as e:
            err_msg = str(e)
            if "429" in err_msg or "quota" in err_msg.lower() or "limit" in err_msg.lower():
                print(f"⚠️ {model_name} hit rate limit. Switching to next model...")
                last_error = e
                continue # Try next model immediately
            else:
                # If it's not a rate limit (e.g., bad request), fail immediately or log?
                # For safety, we treat it as failure of this model and try next.
                print(f"❌ {model_name} error: {e}")
                last_error = e
                continue

    # If all models fail, raise the last error
    raise Exception(f"All models exhausted. Last error: {last_error}")

# No longer used, but kept for reference or removed? Removing to keep specific.


def get_autonomous_topics(count=1):
    # 1. GitHub Trending Topic (Always 1)
    github_topics = []
    try:
        trends = get_github_trending()
        if trends:
            github_topics = [trends[0]] # Top 1 trend
    except Exception as e:
        print(f"⚠️ GitHub trend fetch failed: {e}")

    # 2. AI Error Topics (Count requested via args)
    # Model configuration is handled inside generate_smart
    
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
    
    print(f"🧠 AI is brainstorming {count} unique error topics...")
    ai_topics = []
    try:
        response = generate_smart(prompt)
        text = response.text.strip()
        if text.startswith("```json"): text = text[7:]
        if text.startswith("```"): text = text[3:]
        if text.endswith("```"): text = text[:-3]
        data = json.loads(text)
        ai_topics = data.get("topics", [])[:count]
    except Exception as e:
        print(f"❌ Brainstorming failed: {e}")
        ai_topics = ["Common Python TypeError"] * count

    # Combine: AI Topics + 1 GitHub Topic
    final_topics = [{'text': t, 'type': 'error'} for t in ai_topics] + \
                   [{'text': t, 'type': 'trend'} for t in github_topics]
                   
    print(f"✅ Final Topics Selected: {len(ai_topics)} Errors + {len(github_topics)} GitHub Trend")
    return final_topics

def generate_and_save(topic_obj):
    # Retrieve text and type
    if isinstance(topic_obj, dict):
        topic_text = topic_obj['text']
        topic_type = topic_obj['type']
    else:
        topic_text = topic_obj
        topic_type = 'error' # Default

    if topic_type == 'trend':
        prompt = f"""
        Write a clear, expert-level 'Tech Trend' article for developers about this GitHub repository/trend: "{topic_text}".
        Focus on WHY it is trending, WHAT problem it solves, and HOW to use it. Do NOT write it as a bug fix.

        [STRICT JSON FORMAT REQUIRED]
        {{
            "title": "Short, punchy title (Max 60 chars)",
            "slug": "url-friendly-slug",
            "language": "Primary Language/Tech (e.g., 'Python', 'Rust')",
            "code": "Trend",
            "tags": ["Tech Trend", "GitHub"],
            "analysis": "Detailed explanation of what this tool/repo is and why it's popular right now. Use HTML <p> tags.",
            "root_cause": "Key Features: List the main features or innovations.",
            "bad_code": "Example usage snippet (Show how to install or start using it).",
            "solution_desc": "Use Cases: When should a developer use this?",
            "good_code": "Advanced usage example or configuration snippet.",
            "verification": "Future Outlook: Why this matters for the industry."
        }}
        
        IMPORTANT: Respond ONLY with the JSON.
        """
    else:
        prompt = f"""
        Write a clear, expert-level technical article for developers about: "{topic_text}".
        
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

    print(f"🤖 Generating ({topic_type}): '{topic_text[:30]}...'...")
    try:
        response = generate_smart(prompt)
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
        post_data['title'] = post_data.get('title', topic_text)
        post_data['slug'] = post_data.get('slug', re.sub(r'[^a-z0-9]', '-', topic_text.lower()))
        post_data['language'] = post_data.get('language', 'General')
        post_data['code'] = post_data.get('code', 'Error')
        post_data['date'] = date_str
        post_data['id'] = int(now.timestamp()) + hash(post_data['title']) % 1000
        post_data['type'] = topic_type  # Save content type for frontend rendering

        # FORCE TAGS BASED ON TYPE
        if topic_type == 'trend':
            post_data.setdefault('tags', [])
            if "Tech Trend" not in post_data['tags']: post_data['tags'].append("Tech Trend")
            if "GitHub" not in post_data['tags']: post_data['tags'].append("GitHub")
        else:
            post_data.setdefault('tags', [])
            if "Error Fix" not in post_data['tags']: post_data['tags'].append("Error Fix")

        filename = f"{post_data['slug']}.js"
        file_path = os.path.join(target_dir, filename)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(f"window.onPostDataLoaded({json.dumps(post_data, indent=4, ensure_ascii=False)});")
            
        return post_data, file_path
    except Exception as e:
        print(f"❌ Failed for {topic_text}: {e}")
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

def update_sitemap():
    """Generates/Updates sitemap.xml for SEO"""
    base_url = "https://how-to-fix-error.vercel.app" # Replace with your actual domain
    
    if not os.path.exists(INDEX_FILE): return

    with open(INDEX_FILE, 'r', encoding='utf-8') as f:
        content = f.read()
        match = re.search(r'(?:const|var) postsIndex = (\[.*\]);', content, re.DOTALL)
        if not match: return
        posts = json.loads(match.group(1))

    sitemap_content = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        f'  <url><loc>{base_url}/</loc><priority>1.0</priority></url>',
        f'  <url><loc>{base_url}/pages/solutions.html</loc><priority>0.9</priority></url>',
        f'  <url><loc>{base_url}/pages/about.html</loc><priority>0.5</priority></url>'
    ]

    for p in posts:
        loc = f"{base_url}/pages/post.html?id={p['id']}"
        sitemap_content.append(f'  <url><loc>{loc}</loc><lastmod>{p["date"]}</lastmod><priority>0.8</priority></url>')

    sitemap_content.append('</urlset>')

    with open('sitemap.xml', 'w', encoding='utf-8') as f:
        f.write('\n'.join(sitemap_content))
    print(f"✅ Sitemap.xml updated successfully!")

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
        update_sitemap()


