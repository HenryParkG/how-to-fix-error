window.onPostDataLoaded({
    "title": "Analyze Trending Repo: slavingia/skills (Claude Code)",
    "slug": "trend-analysis-slavingia-skills",
    "language": "TypeScript/JSON",
    "code": "Trend",
    "tags": [
        "Tech Trend",
        "GitHub",
        "TypeScript"
    ],
    "analysis": "<p>The 'slavingia/skills' repository is trending because it bridges the gap between AI coding assistants and business philosophy. It provides a set of custom 'skills' for Anthropic's Claude Code (a command-line tool) that are specifically tuned to the principles of 'The Minimalist Entrepreneur'.</p><p>This is significant because it moves AI interaction from generic code generation to 'opinionated engineering.' By providing Claude with specific heuristics for building lean, profitable software, developers can automate decision-making that aligns with Sahil Lavingia's business framework.</p>",
    "root_cause": "Context-Injection via custom tool definitions and MCP (Model Context Protocol) patterns that allow Claude to act as a business-aware agent.",
    "bad_code": "npm install -g @anthropic-ai/claude-code\n# Clone the skills repo\ngit clone https://github.com/slavingia/skills.git",
    "solution_desc": "Use these skills when you are in the 0-to-1 phase of a startup. It is best used for quickly prototyping features, setting up landing pages, and ensuring that the codebase doesn't suffer from 'feature creep' by applying minimalist constraints.",
    "good_code": "// Example of a Skill definition for Claude\n{\n  \"name\": \"minimalist_audit\",\n  \"description\": \"Analyzes code for unnecessary complexity\",\n  \"run\": \"grep -r 'redundant_logic' ./src\"\n}",
    "verification": "The future of this trend lies in 'Agentic Contexts'\u2014where developers don't just share code, but share the 'mindset' (via JSON skills) that the AI should adopt while writing that code.",
    "date": "2026-03-26",
    "id": 1774518869,
    "type": "trend"
});