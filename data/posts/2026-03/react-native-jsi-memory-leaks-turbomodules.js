window.onPostDataLoaded({
    "title": "Fix React Native JSI Memory Leaks in TurboModules",
    "slug": "react-native-jsi-memory-leaks-turbomodules",
    "language": "TypeScript",
    "code": "JSIMemoryLeak",
    "tags": [
        "React",
        "Frontend",
        "TypeScript",
        "Error Fix"
    ],
    "analysis": "<p>The JavaScript Interface (JSI) in React Native allows C++ to hold references to JavaScript objects. A common source of memory leaks in TurboModules occurs when a native C++ object stores a jsi::Function or jsi::Object in a long-lived member variable without accounting for the lifecycle of the jsi::Runtime.</p><p>Because JSI objects are not automatically tracked by the JavaScript Garbage Collector (GC) when held in native memory, these references prevent the underlying JS objects from being collected, even if the JS-side component has been unmounted. If the native module is re-instantiated or keeps references in a static context, memory consumption grows linearly.</p>",
    "root_cause": "Strong references to jsi::Values held in C++ memory that outlive their intended lifecycle or fail to be cleared during module invalidation.",
    "bad_code": "class MyTurboModule : public jsi::HostObject {\n  jsi::Function callback_;\n  void setCallback(jsi::Runtime& rt, const jsi::Value& cb) {\n    // Storing a strong reference that prevents GC\n    callback_ = cb.asObject(rt).asFunction(rt);\n  }\n};",
    "solution_desc": "Use jsi::WeakObject for long-lived references where possible, or explicitly nullify jsi::Function/jsi::Object references in the module's 'invalidate' method or destructor.",
    "good_code": "class MyTurboModule : public jsi::HostObject {\n  std::unique_ptr<jsi::Value> callback_;\n  void setCallback(jsi::Runtime& rt, const jsi::Value& cb) {\n    callback_ = std::make_unique<jsi::Value>(rt, cb);\n  }\n  ~MyTurboModule() {\n    // Explicitly release the reference\n    callback_.reset();\n  }\n};",
    "verification": "Use the memory profiler in Xcode or Android Studio. Trigger multiple unmounts of the module and verify that the 'jsi::Runtime' memory heap returns to baseline.",
    "date": "2026-03-20",
    "id": 1773981769,
    "type": "error"
});