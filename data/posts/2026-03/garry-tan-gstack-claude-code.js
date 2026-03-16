window.onPostDataLoaded({
    "title": "Inside Garry Tan's gstack: The Future of AI Coding",
    "slug": "garry-tan-gstack-claude-code",
    "language": "TypeScript",
    "code": "Trend",
    "tags": [
        "Tech Trend",
        "GitHub",
        "TypeScript"
    ],
    "analysis": "<p>The 'gstack' repository represents Y Combinator CEO Garry Tan's highly opinionated 'Claude Code' configuration. It\u2019s trending because it transforms a standard LLM into a fully-fledged engineering team. The stack uses 6 specialized AI personas (CEO, Eng Manager, Release Manager, etc.) to automate the entire SDLC. </p><p>It leverages Claude 3.5 Sonnet's advanced reasoning to handle 'agentic' workflows, where the AI doesn't just write code, but manages its own PRs, runs QA tests, and coordinates feature releases with minimal human intervention.</p>",
    "root_cause": "Role-Based AI Orchestration; Automated QA Gates; GitHub Action Integration; Opinionated CLI tools for Claude-centric development.",
    "bad_code": "npm install -g @anthropic-ai/claude-code\ngit clone https://github.com/garrytan/gstack.git\ncd gstack && ./setup.sh",
    "solution_desc": "Use gstack when building rapid prototypes or maintaining complex TypeScript/Next.js projects where you want AI to act as a 'Force Multiplier' for solo founders.",
    "good_code": "// Example of the 'Release Manager' tool definition in gstack\nexport const releaseManager = {\n  role: \"Release Manager\",\n  instructions: \"Monitor CI/CD, verify build artifacts, and draft changelogs based on git diffs.\",\n  tools: [\"gh-cli\", \"npm-publish\"]\n};",
    "verification": "Expect a shift from 'copilots' to 'autonomous agents' that manage the metadata and quality of code, not just the lines of text.",
    "date": "2026-03-16",
    "id": 1773654993,
    "type": "trend"
});