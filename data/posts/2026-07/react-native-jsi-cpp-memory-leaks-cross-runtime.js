window.onPostDataLoaded({
    "title": "Fixing React Native JSI Memory Leaks in Cross-Runtime",
    "slug": "react-native-jsi-cpp-memory-leaks-cross-runtime",
    "language": "C++ / JS",
    "code": "Memory Leak",
    "tags": [
        "React",
        "TypeScript",
        "C++",
        "Error Fix"
    ],
    "analysis": "<p>React Native's JavaScript Interface (JSI) enables synchronous C++ to JavaScript communication, bypassing the legacy bridge. However, because JSI bridges two separate memory models\u2014the JavaScript engine's garbage collector (e.g., Hermes or V8) and C++'s RAII manual allocation\u2014cyclical reference leaks are common. When a C++ host object retains a strong reference to a JavaScript object, and that JavaScript object in turn maintains a reference back to the native host object, a deadlocked cycle is created. Neither GC can release the cycle, resulting in native heap exhaustion and silent application crashes.</p>",
    "root_cause": "Holding a strong reference (`jsi::Value` or `jsi::Object`) inside a native C++ HostObject that is itself owned or referenced by JS creates a cyclical dependency across the JS/native runtime boundaries.",
    "bad_code": "#include <jsi/jsi.h>\nusing namespace facebook;\n\nclass DatabaseHost : public jsi::HostObject {\npublic:\n    jsi::Value jsCallback; // Strong reference to JS closure\n    \n    DatabaseHost(jsi::Runtime& rt, jsi::Function&& cb) \n        : jsCallback(jsi::Value(rt, cb)) {}\n    // Holds a strong JS reference directly, creating a cyclic reference\n};",
    "solution_desc": "Break cyclic references by using `jsi::WeakObject` instead of a strong global reference when storing JS objects within native host objects. If the native wrapper needs to invoke the JS callback, temporarily upgrade (lock) the weak reference to a strong reference, check for validity, execute the operation, and immediately release it.",
    "good_code": "#include <jsi/jsi.h>\n#include <memory>\nusing namespace facebook;\n\nclass DatabaseHost : public jsi::HostObject {\nprivate:\n    std::unique_ptr<jsi::WeakObject> weakCallback;\npublic:\n    DatabaseHost(jsi::Runtime& rt, jsi::Function&& cb) {\n        // Wrap the JS function inside a WeakObject to prevent cyclical retention\n        weakCallback = std::make_unique<jsi::WeakObject>(rt, cb);\n    }\n\n    void invoke(jsi::Runtime& rt) {\n        if (weakCallback) {\n            jsi::Value strongVal = weakCallback->lock(rt);\n            if (!strongVal.isUndefined() && strongVal.isObject()) {\n                strongVal.asObject(rt).asFunction(rt).call(rt);\n            }\n        }\n    }\n};",
    "verification": "Profile the native heap usage using Xcode's Leaks instrument (iOS) or Android Profiler's Memory profiler. Force garbage collection programmatically in JS via `global.gc()` and ensure that the associated native allocations are correctly deallocated, reflecting a flat-lined native memory footprint.",
    "date": "2026-07-18",
    "id": 1784359676,
    "type": "error"
});