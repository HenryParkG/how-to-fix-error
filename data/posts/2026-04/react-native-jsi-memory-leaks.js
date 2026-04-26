window.onPostDataLoaded({
    "title": "Debugging RN JSI Memory Leaks in High-Freq Modules",
    "slug": "react-native-jsi-memory-leaks",
    "language": "TypeScript",
    "code": "MemoryLeak",
    "tags": [
        "React",
        "Frontend",
        "TypeScript",
        "Error Fix"
    ],
    "analysis": "<p>JavaScript Interface (JSI) allows direct C++ to JS communication, bypassing the bridge. However, memory leaks occur when C++ holds long-lived references to JS objects (jsi::Object) or vice-versa without proper lifecycle management. In high-frequency modules like camera frames or sensors, these leaks cause rapid OOM (Out of Memory) crashes.</p>",
    "root_cause": "Creating jsi::Persistent handles in the C++ layer and failing to release them when the component unmounts or when the JS garbage collector expects the object to be reachable only through JS.",
    "bad_code": "class MyNativeModule : public jsi::HostObject {\n  jsi::Value callback_;\n  void setCallback(jsi::Runtime& rt, jsi::Value& cb) {\n    // Storing a value directly without Persistent or manual cleanup\n    callback_ = jsi::Value(rt, cb);\n  }\n};",
    "solution_desc": "Use jsi::Persistent to manage JS values in C++ and explicitly reset them. Implement a cleanup method that is called during the React Native component's componentWillUnmount to nullify native references.",
    "good_code": "class MyNativeModule : public jsi::HostObject {\n  std::unique_ptr<jsi::Persistent<jsi::Object>> jsCallback_;\n\n  void setCallback(jsi::Runtime& rt, const jsi::Object& cb) {\n    jsCallback_ = std::make_unique<jsi::Persistent<jsi::Object>>(rt, cb);\n  }\n\n  void cleanup() {\n    jsCallback_.reset();\n  }\n};",
    "verification": "Use Xcode Memory Graph or Android Studio Profiler to observe the 'jsi::HostObject' count. Ensure the heap size stabilizes after repeated interactions with the module.",
    "date": "2026-04-26",
    "id": 1777168256,
    "type": "error"
});