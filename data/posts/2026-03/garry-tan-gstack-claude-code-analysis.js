window.onPostDataLoaded({
    "title": "Analyzing gstack: Garry Tan's Claude Code Setup",
    "slug": "garry-tan-gstack-claude-code-analysis",
    "language": "TypeScript",
    "code": "Trend",
    "tags": [
        "Tech Trend",
        "GitHub",
        "Node.js"
    ],
    "analysis": "<p>Garry Tan's 'gstack' is trending because it provides an opinionated framework for using Anthropic's 'Claude Code' as a full-cycle software engineering team. It effectively moves beyond simple chat interfaces into agentic workflows. By defining 6 specific personas\u2014CEO, Engineering Manager, Product Manager, Coder, Release Manager, and QA\u2014it automates the entire SDLC. It's popular because it reduces the cognitive overhead of managing complex AI prompts by structuring them into a command-line 'stack' that handles everything from feature ideation to production deployment.</p>",
    "root_cause": "Agentic Personas, Tool-Use Integration, Git-integrated QA, and Automated Release Cycles.",
    "bad_code": "npm install -g @anthropic-ai/claude-code && git clone https://github.com/garrytan/gstack.git",
    "solution_desc": "Ideal for solo founders or small teams looking to scale output. Use it when you need to bridge the gap between 'code generation' and 'software engineering' by letting Claude manage context across multiple files and testing environments.",
    "good_code": "# Example usage of the gstack persona flow\nclaude \"Analyze current repo and act as EM to create a sprint plan\"\nclaude \"Act as Coder to implement feature X and QA to verify with vitest\"",
    "verification": "The future of AI development lies in multi-agent orchestration like gstack, where the human transitions from 'coder' to 'reviewer/orchestrator'.",
    "date": "2026-03-16",
    "id": 1773637780,
    "type": "trend"
});