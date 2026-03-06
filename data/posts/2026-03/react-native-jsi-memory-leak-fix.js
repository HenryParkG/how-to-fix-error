window.onPostDataLoaded({
    "title": "Fixing React Native JSI Memory Leaks in Turbo Modules",
    "slug": "react-native-jsi-memory-leak-fix",
    "language": "TypeScript",
    "code": "MemoryLeak",
    "tags": [
        "React",
        "TypeScript",
        "Frontend",
        "Error Fix"
    ],
    "analysis": "<p>Migrating to Turbo Modules allows direct C++ communication via JSI (JavaScript Interface), bypassing the bridge. However, a common pitfall is the mismanagement of `jsi::Value` and `jsi::Object` lifetimes. Because JSI objects are not automatically garbage collected by the JavaScript engine when held in C++ memory, creating long-lived references in C++ to JS objects (like callbacks) leads to memory leaks.</p><p>The issue usually manifests when a C++ class member stores a `jsi::Function` to be called after an asynchronous operation, but never releases it or fails to use `jsi::Runtime` correctly during the cleanup phase.</p>",
    "root_cause": "Holding a strong reference to a `jsi::Value` (like a JS callback) within a C++ object that outlives the JavaScript execution context or failing to wrap persistent references in a way the GC can track.",
    "bad_code": "class MyTurboModule : public jsi::HostObject {\n  jsi::Function savedCallback_;\n  \n  void setCallback(jsi::Runtime& rt, const jsi::Value& cb) {\n    // DANGEROUS: Strong reference held indefinitely\n    savedCallback_ = cb.asObject(rt).asFunction(rt);\n  }\n};",
    "solution_desc": "Use `jsi::WeakObject` for references that should not prevent garbage collection, or explicitly manage the lifecycle of `jsi::Persistent` references. Ensure that any callback stored in C++ is cleared or reset to `undefined` once the operation completes or the module is invalidated.",
    "good_code": "class MyTurboModule : public jsi::HostObject {\n  std::unique_ptr<jsi::Persistent<jsi::Function>> persistentCb_;\n\n  void setCallback(jsi::Runtime& rt, const jsi::Value& cb) {\n    // Correct: Use Persistent and manage carefully\n    auto func = cb.asObject(rt).asFunction(rt);\n    persistentCb_ = std::make_unique<jsi::Persistent<jsi::Function>>(rt, func);\n  }\n\n  void onComplete(jsi::Runtime& rt) {\n    if (persistentCb_) {\n      persistentCb_->get(rt).call(rt);\n      persistentCb_.reset(); // Release reference\n    }\n  }\n};",
    "verification": "Use Xcode Memory Graph Debugger or Android Studio Profiler to look for 'jsi::HostObject' instances that persist after the JS component is unmounted.",
    "date": "2026-03-06",
    "id": 1772759972,
    "type": "error"
});