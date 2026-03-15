window.onPostDataLoaded({
    "title": "Inside Garry Tan's gstack: CEO-Led AI Engineering",
    "slug": "garry-tan-gstack-claude-code-setup",
    "language": "TypeScript",
    "code": "Trend",
    "tags": [
        "Tech Trend",
        "GitHub",
        "TypeScript",
        "Next.js"
    ],
    "analysis": "<p>'gstack' is a trending architectural pattern popularized by YC CEO Garry Tan for utilizing Claude Code (Anthropic's CLI). It moves away from simple prompting into 'Agentic Orchestration'. The repository provides a framework where the AI is treated as a full-stack engineering team with six distinct 'Opinionated Tools' or personas.</p><p>It is popular because it solves the 'blank page' problem for CEOs and non-technical founders, allowing them to act as a high-level Product Manager while the gstack handles the breakdown of requirements into technical tasks, implementation, and quality assurance using a structured, multi-role feedback loop.</p>",
    "root_cause": "The 6-Role Persona System: CEO (Vision/Strategy), Engineering Manager (Task Breakdown), Architect (System Design), Coder (Implementation), QA Engineer (Testing), and Release Manager (Deployment).",
    "bad_code": "npm install -g @anthropic-ai/claude-code\n# Clone the gstack configuration\ngit clone https://github.com/garrytan/gstack.git\ncd gstack && ./setup.sh",
    "solution_desc": "Best used for rapid prototyping and Greenfield projects. It is most effective when the user provides high-level 'Product Requirement Documents' (PRDs) and allows the gstack to manage the sub-tasks via Claude Code's filesystem tools.",
    "good_code": "// Example .claudecode configuration for gstack\n{\n  \"roles\": {\n    \"em\": \"Analyze current codebase and generate a TICKET.md before coding\",\n    \"qa\": \"Always run 'npm test' and 'lint' before considering a task complete\",\n    \"release\": \"Update CHANGELOG.md and bump versions on successful QA\"\n  },\n  \"tools\": [\"grep\", \"ls\", \"edit\", \"shell_execute\"]\n}",
    "verification": "The future of gstack points toward 'Autonomous Software Houses' where the human oversight shifts from writing lines of code to reviewing architectural decisions and PRD alignment.",
    "date": "2026-03-15",
    "id": 1773550814,
    "type": "trend"
});