window.onPostDataLoaded({
    "title": "Codeburn: Tracking Your AI Token Costs in Real-Time",
    "slug": "codeburn-ai-token-observability",
    "language": "TypeScript",
    "code": "Trend",
    "tags": [
        "Tech Trend",
        "GitHub",
        "TypeScript"
    ],
    "analysis": "<p>Codeburn is a trending TUI (Terminal User Interface) dashboard designed specifically for developers using AI-assisted coding tools like Claude Code, Cursor, and Codex. As AI usage shifts from occasional chat to deep IDE integration, developers are facing unexpected API bills. Codeburn provides immediate visibility into where tokens are being spent, which files are the 'hungriest,' and the real-time monetary cost of your coding sessions.</p>",
    "root_cause": "Real-time cost tracking, support for Claude/OpenAI/Gemini protocols, and a zero-config TUI that parses local logs from IDE extensions.",
    "bad_code": "npx codeburn@latest",
    "solution_desc": "Essential for freelance developers and small teams who need to prevent 'token burn' during large refactorings or when using 'Agentic' modes that loop multiple times.",
    "good_code": "// Enable monitoring for a specific workspace\ncodeburn track ./my-project --provider claude",
    "verification": "Expect to see standardized 'Cost Observability' plugins integrated directly into IDEs as the 'AI Spend' becomes a standard line item in engineering budgets.",
    "date": "2026-04-19",
    "id": 1776591569,
    "type": "trend"
});