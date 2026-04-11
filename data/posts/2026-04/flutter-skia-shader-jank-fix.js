window.onPostDataLoaded({
    "title": "Eliminating Flutter Skia Shader Compilation Jank",
    "slug": "flutter-skia-shader-jank-fix",
    "language": "TypeScript",
    "code": "ShaderCompilationJank",
    "tags": [
        "Flutter",
        "Mobile",
        "TypeScript",
        "Error Fix"
    ],
    "analysis": "<p>In Flutter apps using the Skia backend, shaders are compiled on-demand the first time a specific animation or transition occurs. This compilation happens on the UI thread, causing frames to drop (jank). This is especially prevalent on iOS where the Skia-to-Metal translation layer adds significant overhead during the initial run.</p>",
    "root_cause": "The engine lacks pre-warmed SkSL (Skia Shading Language) instructions for complex graphics, forcing synchronous runtime compilation.",
    "bad_code": "// No specific code causes this, it is an engine behavior\n// but failing to provide a warmup file triggers it:\nvoid main() {\n  runApp(const MyHighPerformanceApp());\n}",
    "solution_desc": "Generate a shader bundle by running the app in a specialized capture mode and then embedding the resulting `.sksl` file in the application assets for pre-compilation at startup.",
    "good_code": "// 1. Generate: flutter run --profile --cache-sksl\n// 2. Press 'M' to save SkSL\n// 3. Update pubspec.yaml:\n/*\nflutter:\n  assets:\n    - shaders/io.flutter.skp.sksl\n*/\n\n// 4. Build with bundle:\n// flutter build ios --bundle-sksl-path shaders/io.flutter.skp.sksl",
    "verification": "Run the app using the 'Timeline' tool in DevTools and look for 'GrGLProgramBuilder::preLink' calls appearing before the transition starts.",
    "date": "2026-04-11",
    "id": 1775870567,
    "type": "error"
});