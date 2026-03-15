window.onPostDataLoaded({
    "title": "Inside gstack: Garry Tan\u2019s Claude Code Persona Setup",
    "slug": "garry-tan-gstack-claude-code",
    "language": "Python",
    "code": "Trend",
    "tags": [
        "Tech Trend",
        "GitHub",
        "Python"
    ],
    "analysis": "<p>Garry Tan (CEO of Y Combinator) recently popularized 'gstack', a highly opinionated configuration for Anthropic\u2019s 'Claude Code' CLI. It transforms a single AI agent into a virtual C-suite and engineering team. The trend is shifting from 'AI as a chatbot' to 'AI as an autonomous organization'. gstack is trending because it provides a structured framework for solo founders to operate at the scale of a funded startup by delegating specific roles to the LLM agent.</p>",
    "root_cause": "Role-Based Agentic Orchestration using 6 core personas: CEO (Strategy), Eng Manager (Tasking), Product Manager (Requirements), Release Manager (Deployment), Software Engineer (Implementation), and QA (Testing).",
    "bad_code": "npm install -g @anthropic-ai/claude-code\n# Then clone the gstack personas configuration\ngit clone https://github.com/garrytan/gstack.git ~/.gstack",
    "solution_desc": "Best used by solo developers or small teams who need a 'second pair of eyes' on architectural decisions and code quality. It works by injecting system prompts into Claude Code that force the AI to switch perspectives depending on the phase of the development lifecycle (e.g., from 'CEO' during brainstorming to 'QA' during PR reviews).",
    "good_code": "// Example Persona Alias in .clauderc or shell\n// claude --persona ceo \"Review the market viability of this feature\"\n// claude --persona qa \"Write 10 edge-case unit tests for the auth module\"\n\n{ \n  \"personas\": {\n    \"eng-manager\": \"Focus on code maintainability and tech debt...\",\n    \"release-manager\": \"Validate CI/CD logs and versioning...\"\n  }\n}",
    "verification": "Future outlook: This pattern will likely be integrated into IDEs, where 'Persona Switching' becomes a standard UI feature for multi-agent autonomous development.",
    "date": "2026-03-15",
    "id": 1773557120,
    "type": "trend"
});