window.onPostDataLoaded({
    "title": "Fixing React Native JSI Bridge Memory Leaks",
    "slug": "fixing-react-native-jsi-bridge-memory-leaks",
    "language": "C++, TypeScript",
    "code": "MemoryLeak",
    "tags": [
        "TypeScript",
        "React",
        "Node.js",
        "Error Fix"
    ],
    "analysis": "<p>The JavaScript Interface (JSI) in React Native allows direct execution of native C++ code from JavaScript, removing the serialization overhead of the traditional bridge. However, because JSI bypasses standard garbage collection safety, it exposes applications to silent memory leaks when managing objects across the native-to-JS boundary.</p><p>These leaks frequently occur in high-frequency data streaming interfaces (such as camera frames, real-time audio, or Bluetooth diagnostics). If C++ allocations or lambda captures retain references to JavaScript values without explicitly managing their lifecycles, memory climbs continuously until the operating system terminates the process.</p>",
    "root_cause": "The root cause is storing `jsi::Value` or `jsi::Object` references directly inside persistent native structures (like C++ member variables or async thread handlers) using strong pointers. Because the JS engine (Hermes or V8) has no visibility into the C++ stack's reference counting, it cannot garbage-collect these objects, leading to permanent retention of the associated JS scope and native objects.",
    "bad_code": "class NativeFrameHost : public jsi::HostObject {\npublic:\n  jsi::Function jsCallback;\n\n  void registerCallback(jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) {\n    // DANGEROUS: Capturing a raw JSI function value globally prevents JS garbage collection\n    jsCallback = args[0].asObject(rt).asFunction(rt);\n  }\n};",
    "solution_desc": "To fix JSI memory leaks, manage references with `jsi::WeakObject` where appropriate, or dynamically wrap persistent JS variables inside `jsi::Persistent` instances that are explicitly released during destructor calls. Always decouple lifecycle bounds by adding explicit native teardown methods that release raw JSI objects when the corresponding React component unmounts.",
    "good_code": "class NativeFrameHost : public jsi::HostObject {\nprivate:\n  // Safe persistent holding utilizing explicit lifetime teardown patterns\n  std::shared_ptr<jsi::Function> jsCallbackPtr;\n\npublic:\n  void registerCallback(jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) {\n    auto func = args[0].asObject(rt).asFunction(rt);\n    jsCallbackPtr = std::make_shared<jsi::Function>(std::move(func));\n  }\n\n  void unregisterCallback() {\n    // Explicitly release pointer to allow the Hermes GC to clean up JS references\n    jsCallbackPtr.reset();\n  }\n};",
    "verification": "Profile the React Native application using Xcode Instruments (Leaks template) or Android Studio Memory Profiler. Trigger high-frequency communications continuously for 5 minutes, then trigger a manual garbage collection from Hermes. Verify that native heap allocations return to their baseline level.",
    "date": "2026-06-03",
    "id": 1780474070,
    "type": "error"
});