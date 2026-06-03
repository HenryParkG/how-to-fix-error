window.onPostDataLoaded({
    "title": "Inside Odysseus: The Trending Self-Hosted AI Workspace",
    "slug": "odysseus-self-hosted-ai-workspace",
    "language": "TypeScript / Python",
    "code": "Trend",
    "tags": [
        "Tech Trend",
        "GitHub",
        "TypeScript"
    ],
    "analysis": "<p>Privacy-centric local computing has emerged as a massive trend, driving the popularity of 'pewdiepie-archdaemon/odysseus'. Odysseus is an open-source, self-hosted AI workspace designed to orchestrate local LLMs, agents, RAG pipelines, and tools in a single, unified environment. Users are shifting away from centralized, privacy-compromising AI portals (like ChatGPT or Claude) in favor of private, air-gapped workspaces where they maintain absolute control over their sensitive data, documents, and API costs.</p><p>Odysseus has rapidly climbed GitHub's trending charts because it bridges the gap between complex backend LLM orchestrators (like LangChain or Ollama) and a user-friendly, polished document editor layout. It allows non-technical users and developers alike to run advanced AI agents natively on their hardware with plug-and-play ease.</p>",
    "root_cause": "Key Features & Innovations",
    "bad_code": "docker-compose up -d --build",
    "solution_desc": "Best Use Cases & When to adopt",
    "good_code": "version: '3.8'\n\nservices:\n  odysseus-server:\n    image: ghcr.io/pewdiepie-archdaemon/odysseus:latest\n    ports:\n      - \"3000:3000\"\n    environment:\n      - DATABASE_URL=postgresql://postgres:postgres@db:5432/odysseus\n      - OLLAMA_HOST=http://host.docker.internal:11434\n      - ENCRYPTION_KEY=super-secret-key-change-me\n    volumes:\n      - odysseus_data:/app/data\n    depends_on:\n      - db\n\n  db:\n    image: postgres:15-alpine\n    environment:\n      - POSTGRES_USER=postgres\n      - POSTGRES_PASSWORD=postgres\n      - POSTGRES_DB=odysseus\n    volumes:\n      - pgdata:/var/lib/postgresql/data\n\nvolumes:\n  odysseus_data:\n  pgdata:",
    "verification": "Future Outlook",
    "date": "2026-06-03",
    "id": 1780492283,
    "type": "trend"
});