window.onPostDataLoaded({
    "title": "Analyzing Garry Tan's 'gstack' AI Framework",
    "slug": "garry-tan-gstack-analysis",
    "language": "TypeScript",
    "code": "Trend",
    "tags": [
        "Tech Trend",
        "GitHub",
        "Node.js",
        "AI"
    ],
    "analysis": "<p>Garry Tan's 'gstack' is trending because it provides a blueprint for an 'AI-First' engineering organization. It uses 'Claude Code' (Anthropic's CLI agent) paired with a specific Model Context Protocol (MCP) configuration. It treats AI as a '10-person department' by defining 10 specific tool-roles: CEO (Strategy), Eng Manager (Planning), Release Manager (CI/CD), Doc Engineer (Markdown), and QA (Testing).</p><p>It is popular because it moves beyond chat into autonomous execution within the terminal, allowing developers to delegate entire workflows rather than just snippets.</p>",
    "root_cause": "Role-based AI Orchestration & MCP Tooling",
    "bad_code": "npm install -g @anthropic-ai/claude-code\n# Configure gstack roles\nclaude config set --alias gstack-qa \"Act as QA engineer...\"",
    "solution_desc": "Best for fast-moving startups and solo founders. Use it when you need to maintain high documentation standards and test coverage without a dedicated human QA team. Adopt it by mapping your current CLI tools (git, grep, npm) to Claude's tool-calling capabilities.",
    "good_code": "// Example: The 'Doc Engineer' prompt pattern\n{\n  \"role\": \"Doc Engineer\",\n  \"tools\": [\"ripgrep\", \"file_read\"],\n  \"instruction\": \"Scan all new exports in /src and update README.md and /docs automatically before every commit.\"\n}",
    "verification": "The shift toward 'Agentic Workflows' where the terminal is the primary interface for LLMs managing local files.",
    "date": "2026-03-17",
    "id": 1773740770,
    "type": "trend"
});