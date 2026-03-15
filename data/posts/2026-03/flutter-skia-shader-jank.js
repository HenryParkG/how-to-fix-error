window.onPostDataLoaded({
    "title": "Eliminating Flutter UI Jank via Skia Shader Warmup",
    "slug": "flutter-skia-shader-jank",
    "language": "TypeScript",
    "code": "ShaderCompilationJank",
    "tags": [
        "TypeScript",
        "Frontend",
        "Error Fix"
    ],
    "analysis": "<p>Flutter apps on iOS (using the Skia backend) often experience 'first-run' jank. This happens when a complex widget\u2014particularly those with gradients, shadows, or blurs\u2014is rendered for the first time. The Skia engine must compile the required OpenGL/Metal shaders on the UI thread, causing frames to drop. While the new 'Impeller' backend fixes this on iOS, apps targeting Android or older Flutter versions still face this bottleneck.</p>",
    "root_cause": "On-the-fly compilation of Skia Shader Language (SkSL) programs on the main thread during the first encounter of a draw call.",
    "bad_code": "Container(\n  decoration: BoxDecoration(\n    gradient: LinearGradient(\n      colors: [Colors.red, Colors.blue], // Triggering complex shader\n    ),\n  ),\n  child: HeavyWidget(),\n)",
    "solution_desc": "Capture and bundle SkSL shaders. Run the app in 'profile' mode to capture all required shaders into a JSON file, then bundle that file with the production build. This allows the Flutter engine to pre-warm the shaders during app startup rather than during critical UI interactions.",
    "good_code": "// 1. Generate: flutter run --profile --cache-sksl --purge-old-cache\n// 2. Capture: Press 'M' in terminal to save flutter_01.sksl.json\n// 3. Build with bundle:\n// flutter build apk --bundle-sksl-path flutter_01.sksl.json\n\n// No code change required in Dart, but ensure Impeller is enabled for iOS:\n// <key>FLTEnableImpeller</key>\n// <true/>",
    "verification": "Check 'Performance Overlay' in Flutter DevTools. The 'Shader Compilation' bar should be non-existent or minimal during initial navigation to complex screens.",
    "date": "2026-03-15",
    "id": 1773557119,
    "type": "error"
});