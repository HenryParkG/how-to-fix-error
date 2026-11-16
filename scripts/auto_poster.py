import os
import sys
import json
import datetime
import google.generativeai as genai
import re
import argparse
import urllib.request

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
TOPICS_FILE = "scripts/topics.txt"
USED_TOPICS_FILE = "data/used_topics.json"

# 과거 과도하게 중복 생성된 주제 키워드 (재생성 차단)
BANNED_KEYWORDS = (
    "coroutine",
    "wiredtiger",
    "wraparound",
    "state monad",
    "haskell",
    "fetchfailed",
    "bgsave",
    "borrow checker",
    "hookshot",
    "gestaltx",
)

STOPWORDS = {
    "and", "or", "the", "a", "an", "in", "on", "for", "to", "of", "with", "by", "from", "into", "via",
    "is", "are", "was", "were", "be", "been", "being", "not", "no", "cant", "cannot", "wont", "does",
    "did", "have", "has", "had", "how", "when", "why", "what", "this", "that", "your", "you", "new",
    "error", "errors", "fix", "fixes", "fixing", "resolve", "resolving", "debug", "debugging",
    "handling", "prevent", "preventing", "mitigating", "mitigate", "eliminating", "eliminate",
    "troubleshooting", "issue", "issues", "problem", "problems", "stopped", "working", "failed",
    "failing", "failure", "guide", "deep", "dive", "analysis", "overview", "architecture", "modern",
    "open", "source", "trend", "trending", "step", "using", "after", "only", "keeps", "all",
    "windows", "cmd", "powershell", "command", "prompt", "terminal", "system", "file", "files",
    "app", "program", "internal", "external", "operable", "batch", "recognized", "set", "check",
    "10", "11", "during", "access", "denied", "unable", "exe", "err", "net", "browser", "over",
    "behind", "cause", "causes", "solution", "solutions", "xxx", "variable",
    "broken", "characters", "find", "specific", "many", "too",
}

MODELS_TO_TRY = [
    "gemini-flash-latest",
    "gemini-3.1-pro-preview",
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-2.0-flash-exp",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
]


def load_existing_posts():
    """Loads all indexed posts from data/index.js."""
    if not os.path.exists(INDEX_FILE):
        return []
    try:
        with open(INDEX_FILE, "r", encoding="utf-8") as f:
            content = f.read()
        match = re.search(r"(?:const|var) postsIndex = (\[.*\]);", content, re.DOTALL)
        if match:
            return json.loads(match.group(1))
    except Exception as e:
        print(f"⚠️ Warning: Index read failed: {e}")
    return []


def load_used_topics():
    """Loads the list of previously used topic strings."""
    if not os.path.exists(USED_TOPICS_FILE):
        return []
    try:
        with open(USED_TOPICS_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data if isinstance(data, list) else []
    except Exception as e:
        print(f"⚠️ Warning: used_topics read failed: {e}")
    return []


def save_used_topics(new_topics):
    """Appends newly generated topic strings to data/used_topics.json."""
    if not new_topics:
        return
    existing = load_used_topics()
    seen = set(existing)
    for t in new_topics:
        if t and t not in seen:
            existing.append(t)
            seen.add(t)
    os.makedirs(os.path.dirname(USED_TOPICS_FILE), exist_ok=True)
    with open(USED_TOPICS_FILE, "w", encoding="utf-8") as f:
        json.dump(existing, f, indent=2, ensure_ascii=False)


def extract_tokens(text):
    """Extracts normalized core keywords excluding stopwords."""
    clean = re.sub(r"[^a-z0-9]+", " ", (text or "").lower())
    return {w for w in clean.split() if len(w) > 2 and w not in STOPWORDS}


def is_token_overlap(tokens_a, tokens_b):
    """Returns True if two token sets represent the same topic."""
    if not tokens_a or not tokens_b:
        return False
    inter = len(tokens_a & tokens_b)
    union = len(tokens_a | tokens_b)
    jaccard = (inter / union) if union else 0.0
    if jaccard >= 0.45:
        return True
    if inter >= 3 and jaccard >= 0.28:
        return True
    return False


def is_duplicate_topic(topic_text, existing_posts, extra_texts=None, existing_token_sets=None):
    """Checks whether topic_text matches banned keywords or existing posts."""
    lower = (topic_text or "").lower()
    if any(kw in lower for kw in BANNED_KEYWORDS):
        return True

    topic_tokens = extract_tokens(topic_text)
    if not topic_tokens:
        return False

    if existing_token_sets is None:
        existing_token_sets = [
            extract_tokens(f"{post.get('title', '')} {post.get('slug', '')}")
            for post in existing_posts
        ]

    for post_tokens in existing_token_sets:
        if is_token_overlap(topic_tokens, post_tokens):
            return True

    if extra_texts:
        for other in extra_texts:
            if is_token_overlap(topic_tokens, extract_tokens(other)):
                return True

    return False


def load_topics_by_category(path=TOPICS_FILE):
    """Reads topics.txt grouped by '# ...' category headers."""
    if not os.path.exists(path):
        return []

    categories = []
    current = []
    with open(path, "r", encoding="utf-8") as f:
        for raw_line in f:
            line = raw_line.strip()
            if not line:
                continue
            if line.startswith("#"):
                if current:
                    categories.append(current)
                    current = []
                continue
            current.append(line)
    if current:
        categories.append(current)
    return categories


def generate_smart(prompt):
    """Tries generation with multiple models before giving up."""
    genai.configure(api_key=GEMINI_API_KEY)
    last_error = None

    for model_name in MODELS_TO_TRY:
        try:
            print(f"🤖 Trying model: {model_name}...")
            model = genai.GenerativeModel(model_name)
            return model.generate_content(prompt)
        except Exception as e:
            err_msg = str(e)
            if "429" in err_msg or "quota" in err_msg.lower() or "limit" in err_msg.lower():
                print(f"⚠️ {model_name} hit rate limit. Switching to next model...")
            else:
                print(f"❌ {model_name} error: {e}")
            last_error = e

    raise Exception(f"All models exhausted. Last error: {last_error}")


def get_github_trending(existing_posts):
    """Fetches top 30 trending GitHub repos from the last 7 days and picks 1 unseen repo."""
    try:
        date_query = (datetime.datetime.now() - datetime.timedelta(days=7)).strftime("%Y-%m-%d")
        url = (
            f"https://api.github.com/search/repositories"
            f"?q=created:>{date_query}&sort=stars&order=desc&per_page=30"
        )
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=15) as response:
            data = json.loads(response.read().decode("utf-8"))

        items = data.get("items", [])
        existing_blobs = [
            f"{p.get('title', '')} {p.get('slug', '')}".lower()
            for p in existing_posts
        ]

        for repo in items:
            full_name = repo.get("full_name", "")
            repo_name = repo.get("name", "")
            desc = repo.get("description") or "Open-source developer tool"
            full_lower = full_name.lower()
            name_lower = repo_name.lower()

            if any(kw in f"{full_lower} {desc.lower()}" for kw in BANNED_KEYWORDS):
                continue

            # Ensure this repository was never covered before
            already_covered = False
            name_pattern = re.compile(rf"(?:^|[^a-z0-9]){re.escape(name_lower)}(?:$|[^a-z0-9])")
            for blob in existing_blobs:
                if full_lower in blob:
                    already_covered = True
                    break
                if len(name_lower) >= 4 and name_pattern.search(blob):
                    already_covered = True
                    break

            if already_covered:
                continue

            candidate_text = f"{full_name} {desc}"
            if is_duplicate_topic(candidate_text, existing_posts):
                continue

            print(f"🔥 Selected unseen trending GitHub repo: {full_name}")
            return {
                "text": (
                    f"Analyze the trending GitHub repository '{full_name}' ({desc}). "
                    f"Explain why it is popular, key features, installation, and practical usage."
                ),
                "type": "trend",
            }

        print("ℹ️ All top 30 trending GitHub repos were already covered. Using practical error topics instead.")
        return None
    except Exception as e:
        print(f"⚠️ GitHub API Error: {e}")
        return None


def select_error_topics(count, existing_posts, exclude_texts=None):
    """Selects unique practical topics from topics.txt first, then Gemini fallback if exhausted."""
    if count <= 0:
        return []

    selected = []
    extra = list(exclude_texts or [])
    used_topics = set(load_used_topics())
    categories = load_topics_by_category(TOPICS_FILE)
    existing_token_sets = [
        extract_tokens(f"{p.get('title', '')} {p.get('slug', '')}")
        for p in existing_posts
    ]

    # 1순위: topics.txt의 14개 카테고리 중 가장 적게 사용된 카테고리부터 순환 선정
    if categories:
        cat_used_counts = []
        cat_candidates = []
        for cat in categories:
            unused = []
            used_count = 0
            for candidate in cat:
                if candidate in used_topics or is_duplicate_topic(
                    candidate, existing_posts, extra, existing_token_sets=existing_token_sets
                ):
                    used_count += 1
                else:
                    unused.append(candidate)
            cat_used_counts.append(used_count)
            cat_candidates.append(unused)

        while len(selected) < count:
            available_indices = [i for i, lst in enumerate(cat_candidates) if lst]
            if not available_indices:
                break
            available_indices.sort(key=lambda i: (cat_used_counts[i], i))
            picked_any = False
            for c_idx in available_indices:
                if len(selected) >= count:
                    break
                while cat_candidates[c_idx]:
                    candidate = cat_candidates[c_idx].pop(0)
                    if not is_duplicate_topic(
                        candidate,
                        existing_posts,
                        extra + selected,
                        existing_token_sets=existing_token_sets,
                    ):
                        selected.append(candidate)
                        cat_used_counts[c_idx] += 1
                        picked_any = True
                        break
                    cat_used_counts[c_idx] += 1
            if not picked_any:
                break

    # 2순위: topics.txt가 모두 소진된 경우에만 Gemini에게 실용 주제 브레인스토밍 요청
    remaining = count - len(selected)
    if remaining > 0:
        existing_titles = [p.get("title", "") for p in existing_posts[:60]]
        prompt_topics = f"""
You are a Senior Practical Tech Editor for 'ErrorLog'.
Pick {remaining * 2} practical, high-search-volume real-world troubleshooting topics across diverse categories that everyday users and developers encounter.

[Focus Areas - 14 Categories, MIX THEM UP]
1. Windows Keyboard, Mouse, Input & Display Errors (IME, WASD/Fn swap, Win key, dual monitors, DPI scaling, refresh rate)
2. Windows System, Boot, Update, DLL & Performance Fixes (VCRUNTIME140.dll, 0xc000007b, Windows Update 0x80070005, 100% disk, BSOD)
3. CMD, PowerShell & Windows Terminal Fixes (PATH error, ExecutionPolicy, port kill netstat/taskkill, DISM/sfc, chcp 65001, takeown/icacls)
4. Audio, Bluetooth, USB, Printer & Hardware Peripherals (No audio device, Bluetooth audio/disconnect, USB code 43, RAW drive, Print Spooler 0x0000011b, webcam)
5. macOS & MacBook Everyday & Terminal Fixes (App is damaged xattr -cr, Homebrew PATH, xcrun, System Data storage, Spotlight CPU, lsof port kill)
6. Linux, Ubuntu & WSL2 System & Shell Fixes (apt dpkg lock, SSH host key, systemd journalctl, ufw, WSL2 vhdx compact & network/vmmem)
7. Web Browser, Network, Wi-Fi, VPN & DNS Errors (DNS_PROBE_FINISHED_NXDOMAIN, ERR_CONNECTION_REFUSED, SSL certs, Wi-Fi No Internet, hosts file, VPN split tunnel)
8. Microsoft Office (Excel, Word, PowerPoint), CSV & PDF Fixes (Excel CSV UTF-8 garbled text & leading zeros, formula text, VLOOKUP #N/A, Word header line, Outlook, PDF print)
9. PC Gaming, Steam, DirectX, GPU Driver & Discord Fixes (DXGI_ERROR_DEVICE_REMOVED, Steam Disk Write Error, VAN 9003, Discord stream no audio, GPU driver mismatch)
10. Mobile, Cloud Sync (OneDrive, iCloud, Google Drive) & Desktop Apps (OneDrive unlink, iPhone HEIC/transfer error, adb unauthorized, KakaoTalk/Slack/Zoom/OBS black screen)
11. Git, GitHub, VS Code & IDE Productivity Fixes (unrelated histories, gitignore cached, CRLF, GH001 large files, VS Code terminal/Remote-SSH, Gradle sync)
12. Python, AI/CUDA, PyTorch & Data Science Fixes (pip not recognized, cp949 encoding, PEP 668, CUDA OOM, matplotlib Korean font, pandas MemoryError, Jupyter Dead Kernel)
13. JavaScript, TypeScript, React, Next.js & Frontend Fixes (EADDRINUSE, npm ERESOLVE, CORS, React hydration, Next.js 'use client', TS2307, Vite env)
14. Backend, Database (MySQL, PostgreSQL, Redis), Docker & Nginx/Cloud Fixes (Docker Engine stopped, MySQL 1045, Postgres connections, Redis MISCONF, Nginx 502/504, AWS EC2 SSH)

[Strict Rules]
- Do NOT pick abstract or academic topics (NO Haskell, NO C++20 coroutines, NO WiredTiger, NO Postgres wraparound, NO Spark shuffle).
- Do NOT duplicate any already covered topics: {json.dumps(existing_titles + selected)}
- Return ONLY JSON: {{"topics": ["Topic 1", "Topic 2", ...]}}
"""
        print(f"🧠 Topics pool needs {remaining} more; brainstorming practical topics...")
        try:
            response = generate_smart(prompt_topics)
            text = clean_json_response(response.text)
            data = json.loads(text)
            for candidate in data.get("topics", []):
                if len(selected) >= count:
                    break
                if isinstance(candidate, str) and not is_duplicate_topic(candidate, existing_posts, extra + selected):
                    selected.append(candidate.strip())
        except Exception as e:
            print(f"❌ Brainstorming failed: {e}")

    return [{"text": t, "type": "error"} for t in selected[:count]]


def clean_json_response(raw_text):
    """Strips markdown code fences from an LLM JSON response."""
    text = (raw_text or "").strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()


def sanitize_slug(raw_slug, fallback_title, post_id):
    """Produces a clean, filesystem-safe URL slug."""
    base = raw_slug or fallback_title or f"post-{post_id}"
    slug = re.sub(r"[^a-z0-9-]+", "-", base.lower()).strip("-")
    slug = re.sub(r"-{2,}", "-", slug)
    return slug or f"post-{post_id}"


def get_autonomous_topics(count=4):
    existing_posts = load_existing_posts()

    trend_topic = get_github_trending(existing_posts) if count >= 2 else None
    error_needed = count - (1 if trend_topic else 0)
    exclude = [trend_topic["text"]] if trend_topic else []
    error_topics = select_error_topics(error_needed, existing_posts, exclude_texts=exclude)

    all_topics = error_topics + ([trend_topic] if trend_topic else [])
    if not all_topics:
        print("⚠️ No unique topics available to generate.")
        return

    print(f"✅ Selected {len(all_topics)} unique topics:")
    for idx, t in enumerate(all_topics):
        print(f"   [{idx}] ({t['type']}) {t['text'][:80]}")

    topics_spec = [
        {"index": idx, "type": "Tech Trend" if t["type"] == "trend" else "Error Fix", "topic": t["text"]}
        for idx, t in enumerate(all_topics)
    ]

    prompt_content = f"""
You are a practical technical writer for 'ErrorLog'. Write {len(all_topics)} clear, actionable articles matching the exact order and type of the topics below:
{json.dumps(topics_spec, ensure_ascii=False, indent=2)}

[FORMAT for 'Error Fix']
{{
    "title": "Clear Search-Friendly Title (Max 65 chars)",
    "slug": "url-friendly-lowercase-slug",
    "language": "Primary Environment/Tool (e.g. Windows, macOS, Linux, CMD, PowerShell, Hardware, Office, Gaming, Browser, Network, Git, Python, Node.js, React, Docker, SQL)",
    "code": "Short Error Code or Symptom (e.g. IME_FREEZE, ERR_CMD_NOT_FOUND, 0x80070005, VAN_9003, EADDRINUSE)",
    "tags": ["MatchingTag1", "MatchingTag2"],
    "analysis": "Clear symptom description and why this happens using HTML <p> and <code> tags.",
    "root_cause": "Concise technical root cause using HTML <code> tags (NO markdown backticks).",
    "bad_code": "Exact error message, failing command, or symptom scenario.",
    "solution_desc": "Clear step-by-step fix instructions using HTML <code> tags (NO markdown backticks).",
    "good_code": "Copy-pasteable commands, shortcut steps, settings paths, or fixed code/formulas.",
    "verification": "How the user can verify the problem is solved using HTML <code> tags (NO markdown backticks)."
}}

[FORMAT for 'Tech Trend']
{{
    "title": "Trend Title (Max 65 chars)",
    "slug": "url-friendly-lowercase-slug",
    "language": "Primary Language/Stack",
    "code": "Trend",
    "tags": ["Tech Trend", "GitHub", "MatchingTag"],
    "analysis": "Why is this repository trending? (HTML <p> and <code>)",
    "root_cause": "Key Features & Innovations (HTML <code>, NO backticks)",
    "bad_code": "Installation / Quick Start Command",
    "solution_desc": "Best Use Cases & When to adopt (HTML <code>, NO backticks)",
    "good_code": "Code Example / Usage Pattern",
    "verification": "Future Outlook (HTML <code>, NO backticks)"
}}

[CRITICAL TAGGING & FORMATTING RULES]
- Pick tags ONLY from what actually applies to the topic. Do NOT force unrelated tags (e.g. never add "Rust" to a Windows/CMD/Office article).
- Available filter tags to include when applicable:
  - OS & CLI: "Windows", "macOS", "Linux", "CMD", "PowerShell", "Hardware"
  - Apps & Network: "Office", "Gaming", "Browser", "Network"
  - Frontend & Dev: "Git", "React", "Vue", "Next.js", "TypeScript", "CSS"
  - Backend & Infra: "Python", "Node.js", "Go", "Rust", "Java", "Docker", "Kubernetes", "SQL", "AWS"
- Do NOT use markdown backticks (`...`) in analysis, root_cause, solution_desc, or verification; always use <code>...</code> instead.
- Return a SINGLE JSON ARRAY of {len(all_topics)} objects in the exact same order: [ {{...}}, ... ]
- Return raw valid JSON only without markdown fences if possible.
"""

    print(f"✍️  Generating content for {len(all_topics)} posts in one go...")
    try:
        response = generate_smart(prompt_content)
        clean_text = clean_json_response(response.text)
        generated_posts = json.loads(clean_text)
        if not isinstance(generated_posts, list):
            raise ValueError("Model output is not a JSON array")
    except Exception as e:
        print(f"❌ Content generation failed: {e}")
        return

    # 4. Save Files
    saved_files = []
    base_ts = int(datetime.datetime.now().timestamp())
    now = datetime.datetime.now()
    date_str = now.strftime("%Y-%m-%d")
    target_dir = os.path.join(POSTS_DIR, now.strftime("%Y-%m"))
    os.makedirs(target_dir, exist_ok=True)

    for i, post_data in enumerate(generated_posts):
        try:
            topic_type = all_topics[i]["type"] if i < len(all_topics) else "error"
            post_id = base_ts + i

            post_data["date"] = date_str
            post_data["id"] = post_id
            post_data["type"] = topic_type

            slug = sanitize_slug(post_data.get("slug"), post_data.get("title"), post_id)
            filename = f"{slug}.js"
            file_path = os.path.join(target_dir, filename)

            # 기존 파일 덮어쓰기 방지
            suffix = 1
            while os.path.exists(file_path):
                candidate_slug = f"{slug}-{post_id % 10000}" if suffix == 1 else f"{slug}-{post_id % 10000}-{suffix}"
                filename = f"{candidate_slug}.js"
                file_path = os.path.join(target_dir, filename)
                suffix += 1
            post_data["slug"] = filename[:-3]

            # Post-processing tags
            tags = post_data.get("tags") or []
            if not isinstance(tags, list):
                tags = [str(tags)]
            if topic_type == "trend":
                if "Tech Trend" not in tags:
                    tags.append("Tech Trend")
                if "GitHub" not in tags:
                    tags.append("GitHub")
            else:
                if "Error Fix" not in tags:
                    tags.append("Error Fix")
            post_data["tags"] = tags

            with open(file_path, "w", encoding="utf-8") as f:
                f.write(f"window.onPostDataLoaded({json.dumps(post_data, indent=4, ensure_ascii=True)});")

            meta = {
                "id": post_data["id"],
                "title": post_data["title"],
                "slug": post_data["slug"],
                "language": post_data.get("language", "General"),
                "code": post_data.get("code", "Error"),
                "date": post_data["date"],
                "path": file_path.replace("\\", "/"),
                "tags": post_data["tags"],
            }
            saved_files.append(meta)
            print(f"✅ Saved & Indexed: {filename} [{meta['language']}]")
        except Exception as e:
            print(f"⚠️ Failed to save post {i}: {e}")

    if saved_files:
        used_in_batch = [
            all_topics[i]["text"]
            for i in range(min(len(generated_posts), len(all_topics)))
            if all_topics[i]["type"] == "error"
        ]
        save_used_topics(used_in_batch)
        update_index_file(saved_files)
        update_sitemap()


def update_index_file(new_entries):
    try:
        data = load_existing_posts()
        existing_paths = {p.get("path") for p in data}

        for entry in reversed(new_entries):
            if entry["path"] not in existing_paths:
                data.insert(0, entry)
                existing_paths.add(entry["path"])

        with open(INDEX_FILE, "w", encoding="utf-8") as f:
            f.write(f"var postsIndex = {json.dumps(data, indent=4, ensure_ascii=False)};")

        # 1. Update data/latest.js (top 60)
        data_dir = os.path.dirname(INDEX_FILE)
        latest_file = os.path.join(data_dir, "latest.js")
        latest_posts = data[:60]
        with open(latest_file, "w", encoding="utf-8") as f:
            f.write(f"var postsLatest = {json.dumps(latest_posts, indent=2, ensure_ascii=False)};\n")
            f.write("var postsIndex = postsLatest;\n")

        # 2. Update current month's archive (data/archive_YYYY_MM.json)
        now_dt = datetime.datetime.now()
        cur_month_id = now_dt.strftime("%Y_%m")
        cur_archive_file = os.path.join(data_dir, f"archive_{cur_month_id}.json")
        try:
            with open(cur_archive_file, "r", encoding="utf-8") as f:
                cur_month_data = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            cur_month_data = []

        cur_paths = {p.get("path") for p in cur_month_data}
        for entry in reversed(new_entries):
            if entry["path"] not in cur_paths:
                cur_month_data.insert(0, entry)
                cur_paths.add(entry["path"])

        with open(cur_archive_file, "w", encoding="utf-8") as f:
            json.dump(cur_month_data, f, indent=2, ensure_ascii=False)

        # 3. Update data/archive_index.json
        archive_index_path = os.path.join(data_dir, "archive_index.json")
        try:
            with open(archive_index_path, "r", encoding="utf-8") as f:
                archive_index = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            archive_index = []

        found = False
        for entry in archive_index:
            if entry.get("id") == cur_month_id:
                entry["count"] = len(cur_month_data)
                found = True
                break
        if not found:
            archive_index.insert(0, {
                "id": cur_month_id,
                "name": f"{now_dt.year}년 {now_dt.month}월",
                "count": len(cur_month_data),
                "filename": f"archive_{cur_month_id}.json",
            })

        with open(archive_index_path, "w", encoding="utf-8") as f:
            json.dump(archive_index, f, indent=2, ensure_ascii=False)

        print(f"✅ Index & Partitioned Archives updated with {len(new_entries)} items.")
    except Exception as e:
        print(f"❌ Index failure: {e}")


def update_sitemap():
    """Generates/Updates sitemap.xml for SEO."""
    base_url = "https://how-to-fix-error.vercel.app"
    posts = load_existing_posts()
    if not posts:
        return

    sitemap_content = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        f'  <url><loc>{base_url}/</loc><priority>1.0</priority></url>',
        f'  <url><loc>{base_url}/pages/solutions.html</loc><priority>0.9</priority></url>',
        f'  <url><loc>{base_url}/pages/trends.html</loc><priority>0.8</priority></url>',
        f'  <url><loc>{base_url}/pages/about.html</loc><priority>0.5</priority></url>',
    ]

    for p in posts:
        loc = f"{base_url}/pages/post.html?id={p['id']}"
        sitemap_content.append(f'  <url><loc>{loc}</loc><lastmod>{p["date"]}</lastmod><priority>0.8</priority></url>')

    sitemap_content.append("</urlset>")

    with open("sitemap.xml", "w", encoding="utf-8") as f:
        f.write("\n".join(sitemap_content))
    print("✅ Sitemap.xml updated successfully!")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--count", type=int, default=4, help="Number of posts to generate (Default: 4)")
    args = parser.parse_args()

    print(f"🚀 Starting Batch Auto-Poster (Count: {args.count})...")
    get_autonomous_topics(args.count)
    print("✅ Batch process completed.")
