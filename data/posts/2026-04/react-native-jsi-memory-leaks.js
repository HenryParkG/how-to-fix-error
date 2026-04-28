window.onPostDataLoaded({
    "title": "Fixing JSI Memory Leaks in RN TurboModules",
    "slug": "react-native-jsi-memory-leaks",
    "language": "C++",
    "code": "Memory Leak",
    "tags": [
        "React",
        "TypeScript",
        "Frontend",
        "Error Fix"
    ],
    "analysis": "<p>React Native's JSI (JavaScript Interface) allows C++ and JavaScript to interact directly without a bridge. However, holding 'jsi::Value' or 'jsi::Object' instances within C++ class members in a TurboModule creates a persistent reference. If these are not explicitly released or if a circular reference is created between a C++ object and a JS host object, the JS engine's garbage collector cannot reclaim the memory.</p>",
    "root_cause": "Storing 'jsi::Value' or 'jsi::Object' in long-lived C++ objects (like std::shared_ptr) without using 'jsi::WeakObject' or failing to clear them during the module's invalidation phase.",
    "bad_code": "class MyTurboModule : public jsi::HostObject {\n    jsi::Value persistentCallback; // LEAK: Strong reference to JS object\n\n    void setCallback(jsi::Runtime& rt, const jsi::Value& cb) {\n        persistentCallback = jsi::Value(rt, cb);\n    }\n};",
    "solution_desc": "Use 'jsi::WeakObject' for callbacks that don't need to extend the JS object's lifetime, or implement the 'invalidate' method to clear all persistent references when the bridge or surface is destroyed.",
    "good_code": "class MyTurboModule : public jsi::HostObject {\n    std::unique_ptr<jsi::Object> callbackPtr;\n\n    void setCallback(jsi::Runtime& rt, const jsi::Value& cb) {\n        if (cb.isObject()) {\n            callbackPtr = std::make_unique<jsi::Object>(cb.asObject(rt));\n        }\n    }\n\n    ~MyTurboModule() {\n        callbackPtr.reset(); // Ensure cleanup on destruction\n    }\n};",
    "verification": "Use the Chrome DevTools Memory Profiler to track the 'JSIExecutor' heap and look for growing counts of 'HostObject' instances after component unmounting.",
    "date": "2026-04-28",
    "id": 1777341733,
    "type": "error"
});