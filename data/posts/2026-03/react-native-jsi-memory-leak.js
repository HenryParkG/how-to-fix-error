window.onPostDataLoaded({
    "title": "Fixing React Native JSI Memory Leaks",
    "slug": "react-native-jsi-memory-leak",
    "language": "TypeScript",
    "code": "Memory Leak",
    "tags": [
        "React",
        "Frontend",
        "TypeScript",
        "Error Fix"
    ],
    "analysis": "<p>React Native's JavaScript Interface (JSI) allows C++ code to interact directly with the JS engine. However, memory management becomes complex when native modules spawn background threads. If a C++ module captures a `jsi::Object` (like a JS callback) and fails to manage its lifecycle relative to the `jsi::Runtime`, the JS object is never garbage collected, even after the component unmounts.</p>",
    "root_cause": "Holding a strong reference to a `jsi::Value` or `jsi::Object` inside a long-lived C++ object or lambda without using `jsi::Persistent` or manually clearing the reference when the JS runtime is invalidated.",
    "bad_code": "void MyModule::registerCallback(jsi::Runtime& rt, const jsi::Value& cb) {\n  // Leaks because 'callback' keeps the JS object alive indefinitely\n  this->storedCallback = std::make_unique<jsi::Value>(rt, cb);\n}",
    "solution_desc": "Use `jsi::WeakObject` or ensure that references are wrapped in a cleanup mechanism that listens to the Catalyst Instance teardown.",
    "good_code": "void MyModule::registerCallback(jsi::Runtime& rt, const jsi::Object& cb) {\n  // Use HostObject or ensure cleanup on invalidate\n  this->jsCallback = std::make_shared<jsi::Persistent<jsi::Object>>(rt, cb);\n}\n\n// On cleanup\njsCallback.reset();",
    "verification": "Use Xcode Memory Graph or Android Studio Profiler to check for growing 'jsi::Pointer' allocations while toggling the native module.",
    "date": "2026-03-30",
    "id": 1774847872,
    "type": "error"
});