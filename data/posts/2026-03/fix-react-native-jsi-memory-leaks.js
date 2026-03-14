window.onPostDataLoaded({
    "title": "Fixing React Native JSI Memory Leaks in Native Modules",
    "slug": "fix-react-native-jsi-memory-leaks",
    "language": "TypeScript",
    "code": "MemoryLeak (JSI)",
    "tags": [
        "React",
        "TypeScript",
        "C++",
        "Error Fix"
    ],
    "analysis": "<p>React Native's JavaScript Interface (JSI) allows direct C++ to JS communication, bypassing the asynchronous bridge. However, because JSI operates outside the standard React Native garbage collection safety net, developers must manually manage the lifecycle of <code>jsi::Value</code> and <code>jsi::Object</code> references. Memory leaks typically occur when a C++ <code>HostObject</code> holds a strong reference to a <code>jsi::Runtime</code> or a <code>jsi::Value</code> in a static scope or a long-lived lambda closure, preventing the JS engine from reclaiming those objects even after the component unmounts.</p>",
    "root_cause": "Holding long-lived jsi::Value references in a C++ HostObject without explicitly nullifying them or using jsi::WeakObject, leading to circular references between the C++ heap and the JS garbage collector.",
    "bad_code": "class MyModule : public jsi::HostObject {\n  jsi::Value callback_;\n  void setCallback(jsi::Runtime& rt, const jsi::Value& cb) {\n    // Strong reference held forever\n    callback_ = jsi::Value(rt, cb);\n  }\n};",
    "solution_desc": "Use jsi::WeakObject or ensure the HostObject lifecycle is strictly tied to the JS engine's collection cycle. Avoid storing jsi::Value in global or static variables. Implement a cleanup method to release references when the module is no longer needed.",
    "good_code": "class MyModule : public jsi::HostObject {\n  std::unique_ptr<jsi::Persistent<jsi::Function>> callback_;\n  void setCallback(jsi::Runtime& rt, const jsi::Function& cb) {\n    callback_ = std::make_unique<jsi::Persistent<jsi::Function>>(rt, cb);\n  }\n  ~MyModule() {\n    if (callback_) callback_->reset();\n  }\n};",
    "verification": "Use Xcode Memory Graph or Android Studio Profiler to track the allocation of 'HostObject' instances and ensure they decrease after JS-side garbage collection.",
    "date": "2026-03-14",
    "id": 1773480254,
    "type": "error"
});