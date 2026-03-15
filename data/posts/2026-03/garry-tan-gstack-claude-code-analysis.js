window.onPostDataLoaded({
    "title": "Analyzing Garry Tan's gstack: The Future of Agentic Dev",
    "slug": "garry-tan-gstack-claude-code-analysis",
    "language": "TypeScript",
    "code": "Trend",
    "tags": [
        "Tech Trend",
        "GitHub",
        "TypeScript"
    ],
    "analysis": "<p>Gstack is trending because it provides a structured framework for 'Agentic Software Engineering.' Unlike standard LLM chat, gstack uses Claude Code with an opinionated 'C-Suite' hierarchy. It transforms a single AI prompt into a collaborative session between 6 distinct personas: the CEO (Vision), Engineering Manager (Architecture), Developer (Code), Release Manager (Deployment), QA (Testing), and Technical Writer (Documentation). This significantly reduces hallucinations by forcing the model to 'argue' through different stages of the SDLC before writing a single line of code.</p>",
    "root_cause": "Structured Meta-Prompting & Agentic Workflows",
    "bad_code": "git clone https://github.com/garrytan/gstack.git\ncd gstack\nnpm install && npm run setup-claude",
    "solution_desc": "Best for solo founders and small engineering teams who need to maintain enterprise-grade rigor (tests, docs, and architecture reviews) without the overhead of additional staff. Adopt when moving from 'chat-to-code' to 'agentic-system' development.",
    "good_code": "// usage: gstack plan \"Add Stripe integration\"\n// 1. CEO sets business constraints\n// 2. EM generates technical spec\n// 3. Dev implements against spec\n// 4. QA generates and runs playwright tests",
    "verification": "The project represents the shift toward 'Software 2.0' where the developer acts as an Orchestrator rather than a Syntactician.",
    "date": "2026-03-15",
    "id": 1773566743,
    "type": "trend"
});