window.onPostDataLoaded({
    "title": "Analyzing garrytan/gstack: The CEO-Grade Stack",
    "slug": "garry-tan-gstack-analysis",
    "language": "TypeScript / AI",
    "code": "Trend",
    "tags": [
        "Tech Trend",
        "GitHub",
        "TypeScript"
    ],
    "analysis": "<p>Garry Tan's 'gstack' is trending because it provides a blueprint for 'AI-First Engineering'. It moves beyond simple boilerplate by integrating Claude Code with a specific 10-tool configuration. This setup allows a single developer to operate as a full engineering team. It leverages the agentic capabilities of Claude to not just write code, but to handle documentation (Doc Engineer), enforce linting (QA), and manage deployment cycles (Release Manager) through a highly opinionated CLI environment.</p>",
    "root_cause": "Opinionated Automation: Combines Next.js, Tailwind, and Supabase with a pre-configured Claude Code environment for autonomous PR management and architectural consistency.",
    "bad_code": "git clone https://github.com/garrytan/gstack.git\ncd gstack\nnpm install\n# Requires Claude Code CLI",
    "solution_desc": "Best for solo founders or small 'tiger teams' who need to ship enterprise-grade code at startup speed. Adopt it when you want to minimize 'non-coding' overhead like writing docs or manual testing.",
    "good_code": "// gstack logic: Using Claude Code as a manager\n// Prompt: \"@manager implement a new auth flow and update the docs\"\n// The gstack setup uses custom instructions to trigger the 'Doc Engineer' tools automatically.",
    "verification": "The future points toward 'Agentic Workflows' where the IDE handles the lifecycle, not just the syntax. Expect gstack-like configurations to become the standard for AI-native companies.",
    "date": "2026-03-17",
    "id": 1773710193,
    "type": "trend"
});