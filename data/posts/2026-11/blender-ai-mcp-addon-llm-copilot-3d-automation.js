window.onPostDataLoaded({
    "title": "Blender AI MCP Addon: LLM Copilot & MCP Server for 3D",
    "slug": "blender-ai-mcp-addon-llm-copilot-3d-automation",
    "language": "Python",
    "code": "Trend",
    "tags": [
        "Tech Trend",
        "GitHub",
        "Python"
    ],
    "analysis": "<p>The trending repository <code>hitkeeen/blender-ai-mcp-addon</code> integrates Anthropic's Model Context Protocol (MCP) directly into Blender. It bridges 3D software with frontier LLMs such as Claude, ChatGPT, Gemini, and local models running through Ollama.</p><p>Instead of relying on fragile one-off copy-pasting of <code>bpy</code> scripts, this addon exposes Blender's internal state as an interactive MCP server, allowing AI agents to query scene structures, capture viewport screenshots, generate commands, and execute 3D operations iteratively.</p>",
    "root_cause": "Adopts the Model Context Protocol (MCP) to turn Blender into an agent tool provider. It exposes scene inspection tools, viewport visual feedback, and Python execution environments with built-in error reflection loops to recover from <code>bpy</code> script exceptions automatically.",
    "bad_code": "git clone https://github.com/hitkeeen/blender-ai-mcp-addon.git\n# Blender > Edit > Preferences > Add-ons > Install from ZIP\n# Enable 'Blender AI MCP' and set provider credentials (Claude / OpenAI / Ollama)",
    "solution_desc": "<p>Adopt this tool for procedural 3D modeling, automated material creation, scene debugging, and studio lighting setups driven by conversational prompts. It is especially useful for pipeline technical artists and rapid prototyping.</p>",
    "good_code": "{\n  \"mcpServers\": {\n    \"blender\": {\n      \"command\": \"python\",\n      \"args\": [\"-m\", \"blender_ai_mcp\", \"--port\", \"9876\"]\n    }\n  }\n}\n\n# Natural Language Prompt inside Blender:\n# \"Inspect the active object, create a procedural metallic brushed shader, and place a 3-point key/fill/rim lighting setup aimed at its center.\"",
    "verification": "<p>MCP is rapidly becoming the standard protocol for AI tool use across complex desktop creative suites. The <code>blender-ai-mcp-addon</code> repository demonstrates how agentic tool calling and visual multimodal feedback can eliminate manual scripting friction in 3D production pipelines.</p>",
    "date": "2026-11-17",
    "id": 1794894574,
    "type": "trend"
});