window.onPostDataLoaded({
    "title": "Fixing Flutter Skia Shader Jitter",
    "slug": "flutter-skia-shader-jitter-fix",
    "language": "Dart",
    "code": "UiJank",
    "tags": [
        "TypeScript",
        "Flutter",
        "Mobile",
        "Error Fix"
    ],
    "analysis": "<p>Flutter apps on high-refresh rate displays (120Hz+) often experience 'jank' during the first animation of a specific UI element. This is caused by the Skia rendering engine compiling the required GLSL/Metal shaders on the UI thread at the exact moment they are needed. On 120Hz displays, the frame budget is only 8.3ms; shader compilation can take 20-50ms, causing noticeable dropped frames.</p>",
    "root_cause": "Just-in-time (JIT) shader compilation on the raster thread during animation execution.",
    "bad_code": "// No specific code triggers this, but complex UI like:\nreturn Scaffold(\n  body: AnimatedContainer(\n    duration: Duration(milliseconds: 300),\n    decoration: BoxDecoration(\n      gradient: LinearGradient(colors: [Colors.red, Colors.blue]), // Triggers shader comp\n    ),\n  ),\n);",
    "solution_desc": "The industry-standard solution is to perform 'Shader Warmup'. You must capture the Skia Shading Language (SkSL) signatures during a profiling session and bundle them with the application. Alternatively, switch to the 'Impeller' rendering engine which pre-compiles shaders during the app build phase.",
    "good_code": "/* Step 1: Run app in profiling mode and trigger animations */\n// flutter run --profile --cache-sksl --purge-old-cache\n\n/* Step 2: Build with the generated sksl bundle */\n// flutter build apk --bundle-sksl-path flutter_01.sksl.json\n\n/* Alternative for New Flutter versions: Enable Impeller in Info.plist */\n// <key>FLTEnableImpeller</key>\n// <true/>",
    "verification": "Use the Flutter DevTools Performance overlay. The 'Raster' bar should stay consistently below the 8.3ms line during transitions on 120Hz devices.",
    "date": "2026-02-19",
    "id": 1771463935,
    "type": "error"
});