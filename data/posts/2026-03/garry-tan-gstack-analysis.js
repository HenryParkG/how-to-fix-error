window.onPostDataLoaded({
    "title": "Inside Garry Tan's GStack for Claude Code",
    "slug": "garry-tan-gstack-analysis",
    "language": "TypeScript",
    "code": "Trend",
    "tags": [
        "Tech Trend",
        "GitHub",
        "TypeScript"
    ],
    "analysis": "<p>The 'garrytan/gstack' repository has exploded in popularity because it provides a blueprint for turning Claude Code (Anthropic's CLI) into a full-scale engineering team. By leveraging highly opinionated system prompts, it enforces a rigid workflow where AI agents act as specialized personas. This prevents the 'generalist AI' hallucination problem by constraining the AI's context to specific organizational roles.</p>",
    "root_cause": "GStack uses 6 core personas: CEO (Product Vision), Eng Manager (Ticket breakdown), Release Manager (Deployment), QA (Edge cases), Security, and Engineer. This modularity ensures code quality and architectural integrity.",
    "bad_code": "npm install -g @anthropic-ai/claude-code\n# Clone and symlink the gstack custom prompts\ngit clone https://github.com/garrytan/gstack.git",
    "solution_desc": "Adopt GStack when building solo-founder projects or moving to 'AI-first' development. It is best used for greenfield TypeScript/Next.js projects where the AI can manage the entire lifecycle from PRD to CI/CD config.",
    "good_code": "// Usage Pattern: Invoking the Eng Manager persona\nclaude \"@em review the current architecture in /src and create tasks for the Engineer for the Stripe integration\"",
    "verification": "The future of GStack lies in 'Agentic Workflows' where the AI self-corrects based on its own QA persona's feedback before the human ever sees the code.",
    "date": "2026-03-16",
    "id": 1773624311,
    "type": "trend"
});