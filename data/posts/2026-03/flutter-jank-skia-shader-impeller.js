window.onPostDataLoaded({
    "title": "Fixing Flutter Janky Frames via Impeller Migration",
    "slug": "flutter-jank-skia-shader-impeller",
    "language": "TypeScript",
    "code": "UI_JANK_SKIA",
    "tags": [
        "TypeScript",
        "Frontend",
        "Next.js",
        "Error Fix"
    ],
    "analysis": "<p>Flutter apps on iOS and Android often experience 'shader compilation jank.' This occurs because the Skia rendering engine compiles shaders at runtime upon their first use, which can take longer than the 16ms frame budget (60fps), resulting in dropped frames during animations.</p>",
    "root_cause": "Dynamic GLSL compilation on the UI thread during the first encounter of complex draw calls.",
    "bad_code": "// Traditional approach relying on SkSL warmup\nflutter run --bundle-sksl-path shaders.sksl.json\n// This requires manual capture and often misses edge cases.",
    "solution_desc": "Migrate the project to the Impeller rendering engine. Impeller pre-compiles a fixed set of shaders at build time, eliminating runtime compilation. For Android, ensure the Vulkan backend is prioritized over OpenGL.",
    "good_code": "// Modify Info.plist for iOS\n<key>FLTEnableImpeller</key>\n<true/>\n\n// Or run via CLI\nflutter run --enable-impeller",
    "verification": "Use the Flutter DevTools Performance overlay to monitor frame times; confirm the 'Shader Compilation' bar is absent during new animations.",
    "date": "2026-03-20",
    "id": 1773969353,
    "type": "error"
});