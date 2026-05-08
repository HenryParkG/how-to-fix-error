window.onPostDataLoaded({
    "title": "Fixing React Native JSI Memory Leaks in Turbo Modules",
    "slug": "react-native-jsi-memory-leak-fix",
    "language": "TypeScript",
    "code": "MEM_LEAK_JSI",
    "tags": [
        "React",
        "TypeScript",
        "Frontend",
        "Error Fix"
    ],
    "analysis": "<p>React Native JSI (JavaScript Interface) allows direct C++ to JS communication. A common leak occurs when C++ objects hold a <code>jsi::Value</code> or <code>jsi::Object</code> in a member variable. Since the JS Garbage Collector cannot 'see' into the C++ heap, these objects are never collected, even if the JS-side reference is nullified, leading to growing memory usage in Turbo Modules.</p>",
    "root_cause": "Capturing jsi::Value objects in C++ member variables or lambdas without wrapping them in jsi::Persistent or manually managing their lifecycle.",
    "bad_code": "class MyTurboModule : public jsi::HostObject {\n  jsi::Function callback_;\n  void setCallback(jsi::Runtime& rt, const jsi::Value& cb) {\n    // Problem: Direct assignment creates a leak as GC cannot track this\n    callback_ = cb.asObject(rt).asFunction(rt);\n  }\n};",
    "solution_desc": "Use <code>jsi::Persistent</code> to wrap JavaScript values stored in C++. This allows the JS engine to track the reference and requires an explicit <code>reset()</code> to release the memory.",
    "good_code": "class MyTurboModule : public jsi::HostObject {\n  std::unique_ptr<jsi::Persistent<jsi::Function>> persistentCallback_;\n  \n  void setCallback(jsi::Runtime& rt, const jsi::Value& cb) {\n    // Solution: Store as a Persistent reference\n    persistentCallback_ = std::make_unique<jsi::Persistent<jsi::Function>>(\n      rt, cb.asObject(rt).asFunction(rt)\n    );\n  }\n  \n  ~MyTurboModule() { persistentCallback_.reset(); }\n};",
    "verification": "Use Xcode Memory Graph or Android Studio Profiler to look for non-deallocated C++ HostObjects after the JS component unmounts.",
    "date": "2026-05-08",
    "id": 1778217805,
    "type": "error"
});