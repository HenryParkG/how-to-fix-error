window.onPostDataLoaded({
    "title": "AgentSeal/codeburn: TUI for AI Token Observability",
    "slug": "codeburn-ai-token-observability",
    "language": "TypeScript",
    "code": "Trend",
    "tags": [
        "Tech Trend",
        "GitHub",
        "TypeScript",
        "AI"
    ],
    "analysis": "<p>As developers shift toward agentic workflows using Claude Code, Cursor, and Codex, token costs have become a 'black box.' AgentSeal/codeburn is trending because it provides a real-time, interactive TUI (Terminal User Interface) that intercepts and aggregates API usage data. It allows developers to see exactly how much money each 'Refactor' or 'Index' command costs before the monthly bill arrives.</p>",
    "root_cause": "Real-time cost tracking, support for multi-provider (Anthropic/OpenAI) cost mapping, and a low-overhead interactive dashboard.",
    "bad_code": "npm install -g @agentseal/codeburn\ncodeburn --watch",
    "solution_desc": "Perfect for individual developers using 'pay-as-you-go' LLM keys or small teams needing to audit which projects are consuming the most tokens in their IDE/CLI agents.",
    "good_code": "# Analyze logs from Cursor or Claude Code\ncodeburn analyze ./path/to/logs --provider anthropic --model claude-3-5-sonnet",
    "verification": "The project is rapidly gaining stars; expect future integrations with CI/CD to prevent 'runaway' agent loops from draining API credits.",
    "date": "2026-04-17",
    "id": 1776403311,
    "type": "trend"
});