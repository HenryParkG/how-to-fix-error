window.onPostDataLoaded({
    "title": "Claude Code Skills: The Minimalist Entrepreneur",
    "slug": "claude-code-skills-slavingia-analysis",
    "language": "TypeScript / Claude Code",
    "code": "Trend",
    "tags": [
        "Tech Trend",
        "GitHub",
        "TypeScript"
    ],
    "analysis": "<p>The repository 'slavingia/skills' has surged in popularity as it represents the first major 'community-driven skill-set' for Claude Code, Anthropic\u2019s new CLI agent. It bridges the gap between high-level business philosophy (Sahil Lavingia's 'The Minimalist Entrepreneur') and low-level code execution. By injecting specific business logic rules and coding patterns into the AI's runtime, it allows Claude to not just write code, but to write code that adheres to 'Minimalist' principles: profitability, sustainability, and lean architecture.</p>",
    "root_cause": "Standardizes AI agent behavior using specialized system prompts and MCP (Model Context Protocol) configs to automate the 'Minimalist Entrepreneur' workflow.",
    "bad_code": "git clone https://github.com/slavingia/skills.git\ncp -r skills/ ~/.claude/skills/",
    "solution_desc": "Use this when building MVP-stage startups where speed and code-cleanliness are paramount. It is ideal for solo-developers using Claude Code who want to automate repetitive 'business-logic' scaffolding.",
    "good_code": "// Example skill definition for Claude Code\n{\n  \"name\": \"minimalist-startup-check\",\n  \"description\": \"Validates if a feature is lean enough for an MVP\",\n  \"patterns\": [\"is_profitable\", \"is_automated\"],\n  \"run\": \"claude run check-lean --input ./src\"\n}",
    "verification": "The project is a harbinger of 'Persona-Driven AI Development,' where developers share not just libraries, but entire behavioral profiles for their AI coding partners.",
    "date": "2026-03-27",
    "id": 1774574654,
    "type": "trend"
});