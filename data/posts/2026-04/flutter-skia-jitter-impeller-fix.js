window.onPostDataLoaded({
    "title": "Fixing Skia Shader Jitter in Flutter Impeller Migrations",
    "slug": "flutter-skia-jitter-impeller-fix",
    "language": "Dart",
    "code": "UI_JANK",
    "tags": [
        "TypeScript",
        "Frontend",
        "Mobile",
        "Error Fix"
    ],
    "analysis": "<p>Shader compilation jank occurs in Flutter's Skia backend when a shader is compiled on the UI thread at the exact moment an animation starts. While Impeller (Flutter's new rendering engine) aims to solve this by pre-compiling shaders, migration issues often arise when legacy custom painters or complex clips force the engine to fallback or re-trigger expensive Pipeline State Object (PSO) creations during frame rasterization.</p>",
    "root_cause": "Over-reliance on SaveLayer calls in custom shaders and failure to enable Impeller's background compilation flags on specific iOS/Android hardware abstraction layers.",
    "bad_code": "// Legacy approach causing Skia jank\nvoid paint(Canvas canvas, Size size) {\n  // Triggering complex saveLayer without caching\n  canvas.saveLayer(Rect.fromLTWH(0, 0, 200, 200), Paint());\n  canvas.drawPath(complexPath, shaderPaint);\n  canvas.restore();\n}",
    "good_code": "// Optimized for Impeller Migration\n// 1. Enable Impeller in Info.plist / AndroidManifest.xml\n// 2. Use specialized components to avoid SaveLayer\n\n@override\nvoid paint(Canvas canvas, Size size) {\n  // Use simple clipping or BackdropFilter with caution\n  canvas.clipPath(complexPath);\n  canvas.drawRect(size.offsets, shaderPaint);\n}",
    "verification": "Run 'flutter run --release --trace-skia' and inspect the DevTools Performance overlay for 'GrShaderMSL' compilation frames.",
    "date": "2026-04-27",
    "id": 1777277261,
    "type": "error"
});