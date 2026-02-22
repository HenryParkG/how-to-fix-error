window.onPostDataLoaded({
    "title": "Mitigating Flutter Raster Jank via Shader Warmup",
    "slug": "flutter-raster-jank-skia-shaders",
    "language": "Dart",
    "code": "RasterJank",
    "tags": [
        "Flutter",
        "TypeScript",
        "Frontend",
        "Error Fix"
    ],
    "analysis": "<p>Flutter uses the Skia engine (or Impeller) for rendering. A common issue is 'jank' during the first execution of an animation. This occurs because the Raster thread must compile Skia Shaders (SkSL) into machine code for the GPU. This Just-In-Time (JIT) compilation can take longer than the 16ms frame budget, causing visible stuttering even on high-end hardware.</p>",
    "root_cause": "Synchronous shader compilation on the Raster thread during the first frame of a complex animation or transition.",
    "bad_code": "void main() {\n  // Standard initialization without shader pre-caching\n  runApp(const MyApp());\n}\n\n// Any complex CustomPainter or Opacity widget will trigger JIT compilation\nWidget build(BuildContext context) {\n  return AnimatedOpacity(opacity: 1.0, child: ComplexCanvas());\n}",
    "solution_desc": "Capture the required shaders during a training run and bundle them as an SkSL JSON file. This allows the Flutter engine to perform 'warmup'\u2014compiling the shaders during app startup rather than during the animation.",
    "good_code": "// 1. Run app to capture: flutter run --bundle-sksl-path shaders.sksl.json\n// 2. Build with captured shaders:\n// flutter build apk --bundle-sksl-path shaders.sksl.json\n\n// No specific code change required in Dart, but ensuring SkSL bundle is included in assets.",
    "verification": "Run the app with 'flutter run --trace-skia'. Open DevTools and verify the 'Raster' thread no longer shows red bars (frame misses) during the specific animation sequence.",
    "date": "2026-02-22",
    "id": 1771735527,
    "type": "error"
});