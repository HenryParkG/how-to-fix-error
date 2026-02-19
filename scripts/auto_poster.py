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
    # 1. GitHub Trending Topic (Always 1) - Keep existing logic
    github_topics = []
    try:
        trends = get_github_trending()
        if trends:
            github_topics = [{'text': trends[0], 'type': 'trend'}] # Top 1 trend
    except Exception as e:
        print(f"⚠️ GitHub trend fetch failed: {e}")

    # 2. AI Error Topics (Brainstorming)
    count = 3 # Fixed to 3 errors + 1 trend
    
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

    # Diversified Categories
    prompt_topics = f"""
    You are a Senior Tech Editor for 'ErrorLog'. Pick {count} high-value, complex, and DIVERSE programming errors.
    Already covered: {existing_titles[:20]}...
    
    [Target Categories - MIX THEM UP]
    1. **System & Lower Level**: Rust (Borrow Checker), C++20 (Coroutines), Go (Goroutines), Zig, eBPF, Linux Kernel
    2. **Data & AI Engineering**: Kafka (Rebalancing), Spark (OOM), PyTorch (CUDA/Quantization), Airflow (DAGs), Vector DBs
    3. **Microservices & Cloud Native**: Kubernetes (CrashLoopBackOff), Istio (Sidecar), gRPC, Terraform (State lock), AWS Lambda (Cold start)
    4. **Niche & Functional**: Elixir (OTP), Haskell (Monads), OCaml, Scala (Akka), WebAssembly
    5. **Advanced Web/Mobile**: Next.js (Hydration), React Native (Bridge), Flutter (Skia), WebGL/WebGPU
    6. **Database Internals**: PostgreSQL (Vacuum/Wraparound), Redis (Fork), Elasticsearch (Sharding), MongoDB (WiredTiger)

    [Rules]
    - Do NOT pick generic "Syntax Error" or "NullPointer". Pick specific, hard-to-debug architectural or runtime issues.
    - Topics must be from different categories (e.g., 1 System, 1 AI, 1 DB).
    - Provide topics as a clean list of strings.
    
    Provide JSON: {{"topics": ["Topic 1", "Topic 2", "Topic 3"]}}
    """
    
    print(f"🧠 Brainstorming {count} diverse error topics...")
    ai_error_topics = []
    try:
        response = generate_smart(prompt_topics)
        text = response.text.strip()
        if text.startswith("```json"): text = text[7:]
        if text.startswith("```"): text = text[3:]
        if text.endswith("```"): text = text[:-3]
        data = json.loads(text)
        ai_error_topics = [{'text': t, 'type': 'error'} for t in data.get("topics", [])[:count]]
    except Exception as e:
        print(f"❌ Brainstorming failed: {e}")
        ai_error_topics = [{'text': "Complex Rust Lifetime Error", 'type': 'error'}] * count

    # Combine Topics
    all_topics = ai_error_topics + github_topics
    print(f"✅ Selected Topics: {[t['text'][:30] for t in all_topics]}")

    # 3. Batch Content Generation
    prompt_content = f"""
    You are an expert developer. Write 4 detailed technical articles based on these topics:
    {json.dumps([t['text'] for t in all_topics])}

    The last topic (index 3) is a 'Tech Trend'. The first 3 are 'Error Fixes'.
    
    [FORMAT for 'Error Fix' (Topics 0, 1, 2)]
    {{
        "title": "Technical Title (Max 60 chars)",
        "slug": "url-friendly-slug",
        "language": "Tech Stack (e.g. Rust, Kafka)",
        "code": "ErrorType (Short)",
        "tags": ["Tag1", "Tag2", "REQUIRED_CATEGORY_TAG"],
        "analysis": "Deep technical analysis (Use HTML <p>).",
        "root_cause": "The specific technical reason for failure.",
        "bad_code": "The buggy code snippet.",
        "solution_desc": "How to fix it architecturally.",
        "good_code": "The fixed code snippet.",
        "verification": "How to verify the fix."
    }}

    [IMPORTANT: TAGGING RULES]
    You MUST include at least one of these exact tags in the "tags" array, based on the topic:
    - Frontend: "React", "Vue", "Next.js", "TypeScript", "CSS"
    - Backend: "Python", "Node.js", "Go", "Rust", "Java"
    - Infra: "Docker", "Kubernetes", "SQL", "AWS"
    (Example: If topic is 'Kafka', add "Java" or "Go" or "SQL" depending on context, or at least "Backend" if none match. But prefer the list above.)

    [FORMAT for 'Tech Trend' (Topic 3)]
    {{
        "title": "Trend Title",
        "slug": "url-friendly-slug",
        "language": "Tech Stack",
        "code": "Trend",
        "tags": ["Tech Trend", "GitHub", "CATEGORY_TAG"],
        "analysis": "Why is this trending? (HTML <p>)",
        "root_cause": "Key Features & Innovations",
        "bad_code": "Installation / Quick Start Command",
        "solution_desc": "Best Use Cases & When to adopt",
        "good_code": "Code Example / Usage Pattern",
        "verification": "Future Outlook"
    }}

    IMPORTANT:
    - Return a SINGLE JSON ARRAY containing 4 objects: `[ {{...}}, {{...}}, {{...}}, {{...}} ]`
    - Ensure valid JSON.
    - Do NOT wrap in markdown blocks if possible, just raw JSON.
    """

    print(f"✍️  Generating content for {len(all_topics)} posts in one go...")
    generated_posts = []
    try:
        response = generate_smart(prompt_content)
        clean_text = response.text.strip()
        if clean_text.startswith("```json"): clean_text = clean_text[7:]
        if clean_text.startswith("```"): clean_text = clean_text[3:]
        if clean_text.endswith("```"): clean_text = clean_text[:-3]
        
        generated_posts = json.loads(clean_text)
    except Exception as e:
        print(f"❌ Content generation failed: {e}")
        return

    # 4. Save Files
    saved_files = []
    for i, post_data in enumerate(generated_posts):
        try:
            # Determine type based on index (Last one is trend)
            # Or trust the AI's structure if it matches
            topic_type = 'trend' if i == len(generated_posts) - 1 else 'error' 
            
            # Additional processing
            now = datetime.datetime.now()
            date_str = now.strftime("%Y-%m-%d")
            post_data['date'] = date_str
            post_data['id'] = int(now.timestamp()) + i # Unique ID
            post_data['type'] = topic_type
            
            # Post-processing tags
            post_data.setdefault('tags', [])
            if topic_type == 'trend':
                if "Tech Trend" not in post_data['tags']: post_data['tags'].append("Tech Trend")
            else:
                if "Error Fix" not in post_data['tags']: post_data['tags'].append("Error Fix")

            # Save
            target_dir = os.path.join(POSTS_DIR, now.strftime("%Y-%m"))
            os.makedirs(target_dir, exist_ok=True)
            
            filename = f"{post_data['slug']}.js"
            file_path = os.path.join(target_dir, filename)
            
            with open(file_path, 'w', encoding='utf-8') as f:
                # Use ensure_ascii=True for maximum JS compatibility (escapes unicode)
                f.write(f"window.onPostDataLoaded({json.dumps(post_data, indent=4, ensure_ascii=True)});")
            
            saved_files.append(post_data)
            print(f"✅ Saved: {filename}")

        except Exception as e:
            print(f"⚠️ Failed to save post {i}: {e}")

    # Update Index
    if saved_files:
        update_index_file(saved_files)
        update_sitemap()


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
    parser.add_argument("--count", type=int, default=4, help="Number of posts to generate (Default: 4)")
    args = parser.parse_args()

    print(f"🚀 Starting Batch Auto-Poster (Count: {args.count})...")
    get_autonomous_topics(args.count) # Pass the count argument
    print("✅ Batch process completed.")


