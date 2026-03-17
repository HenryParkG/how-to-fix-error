window.onPostDataLoaded({
    "title": "Analyze gstack: Garry Tan's Opinionated AI Stack",
    "slug": "garry-tan-gstack-analysis",
    "language": "TypeScript",
    "code": "Trend",
    "tags": [
        "Tech Trend",
        "GitHub",
        "TypeScript",
        "Node.js"
    ],
    "analysis": "<p>The 'garrytan/gstack' repository is trending because it codifies the 'CEO-Engineer' workflow using Claude Code and the Model Context Protocol (MCP). It represents a shift from simple AI code assistance to an autonomous multi-role agent system. By using 10 specific tools\u2014ranging from memory management to automated QA\u2014it allows a single developer to operate like a full engineering department.</p><p>The stack is popular because it solves the 'context drift' problem in AI coding, where the LLM loses track of large codebase architectures. It treats the AI not as a text generator, but as a system administrator with elevated privileges to execute, test, and deploy code.</p>",
    "root_cause": "Claude Code, MCP Servers (Google Maps, GitHub, Sequential Thinking), Cursor, and custom CLI wrappers for automated PR reviews and documentation.",
    "bad_code": "git clone https://github.com/garrytan/gstack.git\ncd gstack && npm install\n# Initialize the AI roles\nexport CLAUDE_CODE_ROLE=CEO",
    "solution_desc": "Adopt gstack when building MVPs or maintaining complex TypeScript/Next.js projects where you want an AI to handle the 'Release Manager' and 'QA' roles automatically.",
    "good_code": "// Example: Using the gstack MCP pattern to define a QA tool\nconst qaBot = new GStackTool({\n  role: 'QA_Engineer',\n  tools: ['jest-executor', 'playwright-vrt'],\n  constraints: 'Must achieve 90% coverage before passing to Release_Manager'\n});",
    "verification": "The future of this trend points toward 'Autonomous Software Houses' where human developers focus on high-level architecture while the gstack handles implementation and verification cycles.",
    "date": "2026-03-17",
    "id": 1773722819,
    "type": "trend"
});