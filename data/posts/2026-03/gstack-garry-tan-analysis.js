window.onPostDataLoaded({
    "title": "Garry Tan's gstack: The Future of Agentic AI Engineering",
    "slug": "gstack-garry-tan-analysis",
    "language": "Next.js",
    "code": "Trend",
    "tags": [
        "Tech Trend",
        "GitHub",
        "Next.js"
    ],
    "analysis": "<p>'gstack' is a viral GitHub repository by Garry Tan that codifies an 'agentic' developer workflow using Claude Code. It's trending because it moves beyond simple code completion into autonomous engineering roles. The setup treats the AI as a full product team, utilizing 6 specialized tools to automate the entire software lifecycle from vision to deployment. It enables solo founders to operate with the throughput of a small engineering team by offloading cognitive overhead to specific AI personas.</p>",
    "root_cause": "1. CEO Persona: Strategy & ROI. 2. Engineering Manager: Task breakdown. 3. Senior Eng: Implementation. 4. QA: Automated testing. 5. Release Manager: CI/CD. 6. Product Manager: Feature spec validation.",
    "bad_code": "npm install -g @anthropic-ai/claude-code && claude --init-gstack",
    "solution_desc": "Adopt gstack when building MVPs or greenfield projects where speed is critical. It is best used in Next.js/Tailwind environments where the AI has high context. Use it by initializing the 'Agentic Loop' which forces the AI to check its own work through the QA and EM tools before marking a task as complete.",
    "good_code": "// gstack-config.json example usage\n{\n  \"roles\": [\"CEO\", \"EM\", \"SeniorEng\", \"QA\", \"ReleaseMgr\", \"PM\"],\n  \"workflow\": \"agentic-loop\",\n  \"lint_on_save\": true,\n  \"auto_test_on_commit\": true\n}",
    "verification": "The trend suggests a shift towards 'AI-Native' development where the developer acts more as a conductor of agents than a syntax writer.",
    "date": "2026-03-16",
    "id": 1773644787,
    "type": "trend"
});