window.onPostDataLoaded({
    "title": "Fixing React Native JSI Memory Leaks in Bridge Calls",
    "slug": "react-native-jsi-memory-leak-fix",
    "language": "TypeScript",
    "code": "MemoryLeak",
    "tags": [
        "React",
        "TypeScript",
        "Error Fix"
    ],
    "analysis": "<p>JavaScript Interface (JSI) allows C++ to maintain references to JavaScript objects. A common leak occurs when C++ code captures a jsi::Value or jsi::Object in a long-lived lambda or a global map without using a WeakObject or ensuring explicit invalidation. Because the JavaScript Garbage Collector cannot see references held inside C++ heap-allocated memory, these JS objects are never collected, leading to a steady increase in memory consumption in high-frequency scenarios like sensor data streaming.</p>",
    "root_cause": "Strong references to jsi::Value objects held in C++ memory outliving their intended JavaScript lifecycle.",
    "bad_code": "// C++ snippet holding a strong reference\njsi::Function callback = args[0].asObject(runtime).asFunction(runtime);\n// Storing the function directly in a vector prevents GC\nstoredCallbacks.push_back(jsi::Value(runtime, callback));",
    "solution_desc": "Use jsi::WeakObject for long-term storage or ensure that C++ wrappers are explicitly destroyed when the corresponding JS component unmounts.",
    "good_code": "// Use jsi::Object to store, but manage lifecycle via cleanup\nauto callbackPtr = std::make_shared<jsi::Function>(args[0].asObject(runtime).asFunction(runtime));\n\n// Use an ID-based map to allow explicit deletion from JS\nthis->callbacks[callbackId] = std::move(callbackPtr);\n\n// Ensure a cleanup method is exposed to JS\nvoid removeCallback(int id) { this->callbacks.erase(id); }",
    "verification": "Use Xcode Memory Graph or Android Studio Profiler to observe 'jsi::HostObject' counts. Verify that memory returns to baseline after the JS component unmounts.",
    "date": "2026-05-02",
    "id": 1777686865,
    "type": "error"
});