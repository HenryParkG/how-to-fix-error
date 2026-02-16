window.onPostDataLoaded({
    "title": "Solving React Native JSI Memory Leaks",
    "slug": "react-native-jsi-memory-leaks",
    "language": "TypeScript",
    "code": "Memory Leak",
    "tags": [
        "React",
        "TypeScript",
        "Frontend",
        "Error Fix"
    ],
    "analysis": "<p>React Native's JavaScript Interface (JSI) allows synchronous communication between C++ and JavaScript. However, memory leaks occur when C++ HostObjects hold persistent references to <code>jsi::Value</code> or <code>jsi::Object</code> without accounting for the JavaScript garbage collector. If a C++ object outlives the JS engine's context or holds a circular reference back to JS, the memory is never reclaimed.</p>",
    "root_cause": "Storing jsi::Value or jsi::Object directly in C++ class members instead of using jsi::WeakObject or failing to clear global references in the JSI Runtime's teardown phase.",
    "bad_code": "class MyHostObject : public jsi::HostObject {\n  jsi::Value callback_; // Leak: Persistent reference prevents GC\n  MyHostObject(jsi::Value&& cb) : callback_(std::move(cb)) {}\n};",
    "solution_desc": "Use <code>jsi::WeakObject</code> for long-lived JS references within C++ HostObjects or manually manage the lifecycle by nullifying references via a cleanup method called from the JS side.",
    "good_code": "class MyHostObject : public jsi::HostObject {\n  std::unique_ptr<jsi::WeakObject> weakCallback_;\n  void setCallback(jsi::Runtime& rt, const jsi::Object& cb) {\n    weakCallback_ = std::make_unique<jsi::WeakObject>(rt, cb);\n  }\n  // Check lock() before calling\n};",
    "verification": "Use Xcode Memory Graph or Android Studio Profiler to look for growing instances of 'HostObject' after repetitive native module calls.",
    "date": "2026-02-16",
    "id": 1771217707,
    "type": "error"
});