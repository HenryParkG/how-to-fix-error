window.onPostDataLoaded({
    "title": "Debugging JSI Memory Leaks in RN TurboModules",
    "slug": "debug-react-native-jsi-memory-leaks",
    "language": "C++",
    "code": "MemoryLeak",
    "tags": [
        "React",
        "TypeScript",
        "C++",
        "Error Fix"
    ],
    "analysis": "<p>React Native's JSI (JavaScript Interface) allows direct C++ to JS communication. However, holding a <code>jsi::Value</code> or <code>jsi::Object</code> inside a C++ TurboModule as a class member creates a 'strong' reference that the JavaScript Garbage Collector (GC) cannot see. If that C++ object is persistent, the JS object is never collected, leading to a heap grow-only scenario.</p>",
    "root_cause": "Storing strong jsi::Object references in C++ member variables, preventing the JS engine from reclaiming memory even after the JS-side component unmounts.",
    "bad_code": "class MyTurboModule : public jsi::HostObject {\n  jsi::Value callback_;\n  void setCallback(jsi::Runtime& rt, jsi::Value cb) {\n    callback_ = jsi::Value(rt, cb); // Strong reference leak\n  }\n};",
    "solution_desc": "Use <code>jsi::WeakObject</code> or <code>jsi::Persistent</code> with explicit invalidation. For callbacks, ensure they are cleared when the module's lifecycle ends or when the functional requirement is satisfied.",
    "good_code": "class MyTurboModule : public jsi::HostObject {\n  std::unique_ptr<jsi::WeakObject> weakCallback_;\n  void setCallback(jsi::Runtime& rt, jsi::Value cb) {\n    weakCallback_ = std::make_unique<jsi::WeakObject>(rt, cb.asObject(rt));\n  }\n  void run() {\n    // Lock the weak ref before use\n    auto cb = weakCallback_->lock(rt);\n    if (!cb.isUndefined()) { /* call */ }\n  }\n};",
    "verification": "Use Xcode Memory Graph or Android Profiler to monitor the 'JS Heap' size during repeated mount/unmount cycles of the TurboModule.",
    "date": "2026-03-09",
    "id": 1773031610,
    "type": "error"
});