import os
import json
import re

DATA_DIR = r"c:\Users\dgwj\OneDrive\Desktop\Github\how-to-fix-error\data"
INDEX_FILE = os.path.join(DATA_DIR, "index.js")

with open(INDEX_FILE, "r", encoding="utf-8") as f:
    content = f.read()

match = re.search(r'(?:const|var) postsIndex = (\[.*\]);', content, re.DOTALL)
if not match:
    print("❌ postsIndex not found in index.js")
    exit(1)

posts = json.loads(match.group(1))
print(f"Total posts loaded: {len(posts)}")

# 1. Create latest.js (Fast loading, top 60 items)
latest_posts = posts[:60]
latest_file = os.path.join(DATA_DIR, "latest.js")
with open(latest_file, "w", encoding="utf-8") as f:
    f.write(f"var postsLatest = {json.dumps(latest_posts, indent=2, ensure_ascii=False)};\n")
    f.write("var postsIndex = postsLatest;\n")

print(f"Created data/latest.js with {len(latest_posts)} posts.")

# 2. Partition into Monthly Archives
months_dict = {}
for p in posts:
    # Date format is usually YYYY-MM-DD
    date_val = str(p.get("date", ""))
    if len(date_val) >= 7 and "-" in date_val:
        year, month = date_val[:7].split("-")
        month_id = f"{year}_{month}"
    else:
        # Fallback using id if id is timestamp
        pid = str(p.get("id", ""))
        month_id = "2026_10"
        
    if month_id not in months_dict:
        months_dict[month_id] = []
    months_dict[month_id].append(p)

archive_index = []
for month_id in sorted(months_dict.keys(), reverse=True):
    month_posts = months_dict[month_id]
    year, month = month_id.split("_")
    archive_filename = f"archive_{month_id}.json"
    archive_file_path = os.path.join(DATA_DIR, archive_filename)
    
    with open(archive_file_path, "w", encoding="utf-8") as f:
        json.dump(month_posts, f, ensure_ascii=False, indent=2)
        
    archive_index.append({
        "id": month_id,
        "name": f"{year}년 {int(month)}월",
        "count": len(month_posts),
        "filename": archive_filename
    })
    print(f"Created {archive_filename} with {len(month_posts)} posts.")

# 3. Create archive_index.json
archive_index_path = os.path.join(DATA_DIR, "archive_index.json")
with open(archive_index_path, "w", encoding="utf-8") as f:
    json.dump(archive_index, f, ensure_ascii=False, indent=2)

print(f"Created archive_index.json with {len(archive_index)} months.")
