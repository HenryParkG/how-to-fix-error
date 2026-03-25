window.onPostDataLoaded({
    "title": "GitHub Trend: dbskill - Business Diagnosis for Claude Code",
    "slug": "trend-dbskill-claude-code-extension",
    "language": "JSON / Markdown",
    "code": "Trend",
    "tags": [
        "Tech Trend",
        "GitHub",
        "TypeScript"
    ],
    "analysis": "<p>The 'dontbesilent2025/dbskill' repository is trending as a specialized extension for 'Claude Code', Anthropic's agentic CLI tool. It provides a structured set of 'Commercial Diagnosis' skills, allowing developers to use Claude not just for coding, but for deep business logic analysis and architectural auditing.</p><p>Its popularity stems from the transition of AI tools from simple 'code generators' to 'domain experts'. By injecting business diagnostic frameworks directly into the tool's context, it enables Claude to identify logic flaws and commercial risks in enterprise codebases.</p>",
    "root_cause": "Key Features: Structured MCP (Model Context Protocol) integration, specialized prompts for business logic verification, and pre-configured skill sets for Claude Code CLI.",
    "bad_code": "git clone https://github.com/dontbesilent2025/dbskill.git\ncd dbskill && ls skills/",
    "solution_desc": "Adopt this when you need Claude Code to perform high-level reviews that go beyond syntax, such as checking if a payment flow matches commercial requirements or if a data model supports specific business KPIs.",
    "good_code": "// Example usage in .claudecode configuration\n{\n  \"skills\": [\"./dbskill/commercial_diagnosis.json\"],\n  \"mode\": \"architect\",\n  \"custom_instructions\": \"Apply business logic auditing to all PR reviews.\"\n}",
    "verification": "The project is rapidly gaining stars as a blueprint for 'Agentic Domain Knowledge'\u2014expect more repos to provide 'skills' rather than just 'code snippets' for AI agents.",
    "date": "2026-03-25",
    "id": 1774421608,
    "type": "trend"
});