window.onPostDataLoaded({
    "title": "Mastering Claude Code Skills: The Minimalist Entrepreneur",
    "slug": "claude-code-minimalist-entrepreneur-skills",
    "language": "TypeScript",
    "code": "Trend",
    "tags": [
        "Tech Trend",
        "GitHub",
        "TypeScript"
    ],
    "analysis": "<p>The 'slavingia/skills' repository is a trending collection of custom capabilities for Anthropic's Claude Code CLI. Inspired by Sahil Lavingia's book 'The Minimalist Entrepreneur', it integrates business-centric logic directly into the AI development workflow. It allows developers to not just write code, but to run market validation, generate landing page copy based on minimalist principles, and manage 'boring' business tasks using AI tools that follow a specific philosophical framework.</p>",
    "root_cause": "The repo leverages Claude Code's 'skill' architecture, which uses MCP (Model Context Protocol) and local execution to allow the AI to perform complex, multi-step business automation tasks.",
    "bad_code": "git clone https://github.com/slavingia/skills.git\ncd skills\n# Add the skills path to your Claude Code config",
    "solution_desc": "Adopt this for 'Founder-Engineering' where you need to balance rapid feature development with business validation. Use it to automate the generation of 'Minimal Viable Products' (MVPs) and to audit your codebase for over-engineering, which goes against the minimalist philosophy.",
    "good_code": "// Example: Using a skill to validate a startup idea via Claude Code\n// !validate_idea \"A SaaS for tracking coffee bean acidity\"\n\nexport const validateIdea = {\n  name: \"validate_idea\",\n  description: \"Runs a minimalist entrepreneur validation framework\",\n  execute: async (args: { idea: string }) => {\n    // Logic to search market trends and cost-of-acquisition\n    return `Validating: ${args.idea}...`;\n  }\n};",
    "verification": "The popularity is driven by the rise of 'AI-native' entrepreneurship, with the repository serving as a blueprint for how developers can use LLMs to handle both the CLI and the CEO roles.",
    "date": "2026-03-29",
    "id": 1774747644,
    "type": "trend"
});