window.onPostDataLoaded({
    "title": "Analyzing slavingia/skills: Claude Code for Entrepreneurs",
    "slug": "claudecode-skills-sahil-lavingia",
    "language": "TypeScript",
    "code": "Trend",
    "tags": [
        "Tech Trend",
        "GitHub",
        "TypeScript",
        "Node.js"
    ],
    "analysis": "<p>The 'slavingia/skills' repository is trending because it bridges the gap between high-level business philosophy ('The Minimalist Entrepreneur') and low-level AI agent execution. As developers move toward 'Claude Code'\u2014Anthropic's terminal-based coding agent\u2014this repo provides a set of specialized skills and MCP (Model Context Protocol) tools that automate the boring parts of building a lean startup, like SEO analysis, landing page scaffolding, and lean validation loops.</p>",
    "root_cause": "Provides pre-configured MCP tools and system prompts that allow Claude Code to perform specific tasks tailored for Sahil Lavingia's 'Minimalist' framework.",
    "bad_code": "npm install -g @anthropic-ai/claude-code\n# Then clone the skills repo\ngit clone https://github.com/slavingia/skills.git",
    "solution_desc": "Use this repository if you are a solo developer or 'minimalist entrepreneur' looking to use Claude as an autonomous CTO. It's best adopted when building MVPs where speed and lean principles are prioritized over complex enterprise architecture.",
    "good_code": "// Example of a custom skill pattern found in the repo\nexport const MinimalistSkill = {\n  name: \"validate_idea\",\n  description: \"Checks if a project follows minimalist entrepreneur principles\",\n  execute: async ({ projectDescription }) => {\n    // Logic to analyze lean viability\n  }\n};",
    "verification": "The repo signals a shift where AI agents are no longer just 'chatting' but are being equipped with specific 'professional frameworks' as executable code.",
    "date": "2026-03-28",
    "id": 1774660719,
    "type": "trend"
});