window.onPostDataLoaded({
    "title": "Analyzing gstack: Garry Tan's Claude AI Workflow",
    "slug": "garry-tan-gstack-claude-setup",
    "language": "Node.js",
    "code": "Trend",
    "tags": [
        "Tech Trend",
        "GitHub",
        "Node.js"
    ],
    "analysis": "<p>The 'gstack' repository is trending because it codifies the concept of 'AI Agent Persona Injection' into the development workflow. Using Claude Code as the engine, it defines six opinionated tools that act as a virtual executive suite and engineering staff. This setup allows a single developer to operate at the speed of a full team by delegating high-level decision-making (CEO), sprint planning (EM), and quality gates (QA) to specifically tuned AI prompts. It is the first major example of a 'CEO-in-a-box' workflow for solo founders.</p>",
    "root_cause": "Multi-persona Agentic Frameworks, Automated PR Review cycles, and Claude 3.5 Sonnet context-window optimization.",
    "bad_code": "git clone https://github.com/garrytan/gstack.git\ncd gstack\nnpm install\ncp .env.example .env # Add Anthropic API Key",
    "solution_desc": "Best used by solo founders and small engineering teams who need to automate 'management overhead'. Adopt this when you spend more than 20% of your time on task tracking or code review rather than feature implementation.",
    "good_code": "// Example of the 'CEO' tool prompt configuration\nconst CEO_TOOL = {\n  role: \"CEO\",\n  mission: \"Maximize product-market fit and velocity\",\n  constraints: [\"No technical debt\", \"Focus on core user value\"],\n  action: (context) => claude.analyzeStrategicImpact(context)\n};",
    "verification": "The future of this trend points toward 'Autonomous Engineering Organizations' where human oversight shifts from writing code to reviewing the strategic output of these personas.",
    "date": "2026-03-15",
    "id": 1773537930,
    "type": "trend"
});