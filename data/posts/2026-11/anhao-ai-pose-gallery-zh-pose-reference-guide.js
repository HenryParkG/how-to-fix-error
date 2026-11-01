window.onPostDataLoaded({
    "title": "Inside anhao/ai-pose-gallery-zh: Zero-Dep AI Pose Library",
    "slug": "anhao-ai-pose-gallery-zh-pose-reference-guide",
    "language": "JavaScript",
    "code": "Trend",
    "tags": [
        "Tech Trend",
        "GitHub",
        "CSS",
        "TypeScript"
    ],
    "analysis": "<p>The GitHub repository <code>anhao/ai-pose-gallery-zh</code> has surged in popularity among AI artists, game concept designers, and Stable Diffusion/ComfyUI practitioners. Generating anatomically consistent, complex character poses using text prompts alone is notoriously unreliable; the repository solves this by compiling a curated Chinese-localized directory of 1,439 pose sets (2,878 total images) paired directly with structural pose references.</p><p>Its standout architectural choice is its zero-dependency, purely static gallery design. Bypassing heavy Node.js runtimes, React frontends, or external CDNs, the entire project runs client-side using pure HTML5, vanilla JavaScript, and modern CSS Grid, enabling instantaneous loading, local offline execution, and integration into existing offline AI toolchains.</p>",
    "root_cause": "Key features include dual-image pose mapping (natural artwork paired with OpenPose/skeleton layouts), comprehensive Chinese terminology indexing across action genres, instant client-side keyword search, and zero-dependency static distribution.",
    "bad_code": "# Quick Start: Clone and run locally using any standard static file server\ngit clone https://github.com/anhao/ai-pose-gallery-zh.git\ncd ai-pose-gallery-zh\n\n# Open index.html directly or serve via Python\npython3 -m http.server 8080\n# Visit http://localhost:8080 in your browser",
    "solution_desc": "Ideal for ControlNet OpenPose workflows, character sheet drafting in ComfyUI, 3D rigging pose reference, and local prompt library management where reliable, zero-latency visual reference is required without internet access.",
    "good_code": "// Example: Integrating pose metadata programmatically into a ComfyUI prompt script\nasync function fetchAndApplyPose(poseCategory, index) {\n  const response = await fetch('./data/poses.json');\n  const gallery = await response.json();\n  \n  const matchedPose = gallery.find(item => \n    item.category === poseCategory && item.id === index\n  );\n\n  if (!matchedPose) {\n    throw new Error(`Pose ${poseCategory}/${index} not found`);\n  }\n\n  // Return formatted payload for ControlNet OpenPose pipeline\n  return {\n    prompt: matchedPose.tags.join(', '),\n    openpose_image_path: `./assets/poses/${matchedPose.skeleton_filename}`,\n    reference_image_path: `./assets/poses/${matchedPose.preview_filename}`\n  };\n}",
    "verification": "The project represents a shift toward lightweight, portable knowledge bases for generative AI tooling. Future iterations are expected to introduce direct browser-to-ComfyUI WebSocket dispatch, WebAssembly-driven 3D pose adjustment, and DWPose/MediaPipe skeleton export integration.",
    "date": "2026-11-01",
    "id": 1793503329,
    "type": "trend"
});